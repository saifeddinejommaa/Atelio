using Atelio.Application.Common;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Atelio.Infrastructure.Documents;

/// <summary>
/// Facture A4 en PDF (QuestPDF) : en-tête société et solde dû, client et véhicule, lignes avec leur TVA,
/// totaux, règlements, résumé de la TVA, mentions légales.
/// </summary>
public class QuestPdfInvoiceRenderer : IInvoicePdfRenderer
{
    private static readonly CultureInfo French = CultureInfo.GetCultureInfo("fr-FR");

    private const string Band = "#5b6170";
    private const string Muted = "#52525b";
    private const string Rule = "#d4d4d8";
    private const string Dark = "#27272a";
    private const string Shade = "#ececee";

    /// <summary>Pénalités de retard (articles L441-10 et D441-5 du Code de commerce).</summary>
    private const string PaymentTerms =
        "Conformément aux dispositions de l'article L441-10 du Code de commerce, tout paiement effectué après l'échéance "
        + "donnera lieu à l'application d'intérêts de retard calculés sur la base de trois fois le taux d'intérêt légal. "
        + "Une indemnité forfaitaire de 40 € pour frais de recouvrement, prévue à l'article D441-5, sera également exigible. "
        + "Aucun escompte n'est accordé pour règlement anticipé.";

    static QuestPdfInvoiceRenderer()
    {
        // Licence Community : vérifier qu'elle couvre la société (seuil de chiffre d'affaires, voir questpdf.com).
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Render(InvoicePdfModel invoice) =>
        Document.Create(container => container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(36);
            page.MarginVertical(32);
            page.DefaultTextStyle(x => x.FontSize(9.5f).FontColor(Dark));

            // En-tête dans le contenu : seulement sur la 1re page.
            page.Content().Column(col =>
            {
                col.Item().Element(c => Header(c, invoice));
                col.Item().PaddingTop(12).Element(c => Content(c, invoice));
            });
            page.Footer().Element(c => Footer(c, invoice.Legal));
        })).GeneratePdf();

    private static string Euro(decimal amount) => amount.ToString("C", French);

    private static string Number(decimal value) => value.ToString("N2", French);

    private static string Day(DateTime date) => date.ToString("dd-MM-yyyy", French);

    // ------------------------------------------------------------
    // En-tête : société à gauche, FACTURE + numéro + solde dû à droite
    // ------------------------------------------------------------

    private static void Header(IContainer container, InvoicePdfModel invoice)
    {
        var legal = invoice.Legal;
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                var logo = LogoSvg(legal.LogoFile);
                if (logo is not null)
                {
                    col.Item().Width(110).Height(45).Svg(logo).FitArea();
                }

                col.Item().PaddingTop(4).Text(legal.CompanyName).Bold().FontSize(11);
                col.Item().Text(legal.Address).FontColor(Muted);
                col.Item().Text("France").FontColor(Muted);
                if (!string.IsNullOrWhiteSpace(invoice.GaragePhone))
                {
                    col.Item().Text(invoice.GaragePhone).FontColor(Muted);
                }
            });

            row.ConstantItem(220).AlignRight().Column(col =>
            {
                col.Item().AlignRight().Text("FACTURE").FontSize(26).FontColor(Dark);
                col.Item().AlignRight().Text($"N° de facture {invoice.Number}").Bold().FontColor(Muted);
                col.Item().PaddingTop(14).AlignRight().Text("Solde dû").FontSize(8).Bold().FontColor(Muted);
                col.Item().AlignRight().Text(Euro(invoice.Remaining)).Bold().FontSize(14);
            });
        });
    }

    // ------------------------------------------------------------
    // Corps
    // ------------------------------------------------------------

    private static void Content(IContainer container, InvoicePdfModel invoice)
    {
        container.Column(col =>
        {
            col.Spacing(12);

            // Client à gauche ; dates et véhicule à droite.
            col.Item().Row(row =>
            {
                row.RelativeItem().PaddingTop(12).Column(left =>
                {
                    left.Item().Text("Facturer à").FontColor(Muted);
                    left.Item().Text(invoice.CustomerName).Bold();
                    if (!string.IsNullOrWhiteSpace(invoice.CustomerPhone))
                    {
                        left.Item().Text(invoice.CustomerPhone);
                    }

                    if (!string.IsNullOrWhiteSpace(invoice.CustomerEmail))
                    {
                        left.Item().Text(invoice.CustomerEmail);
                    }

                    left.Item().Text("France");
                });

                row.ConstantItem(260).Column(right =>
                {
                    right.Spacing(4);
                    InfoRow(right.Item(), "Date de facture :", Day(invoice.IssuedAtLocal));
                    if (invoice.DueDate is DateOnly due)
                    {
                        InfoRow(right.Item(), "Date d'échéance :", due.ToString("dd-MM-yyyy", French));
                    }

                    InfoRow(right.Item(), "Immatriculation :", invoice.VehiclePlate);
                    if (invoice.Mileage is int km)
                    {
                        InfoRow(right.Item(), "Kilométrage :", km.ToString(French));
                    }
                });
            });

            // Objet : le véhicule (marque, modèle et version), puis son immatriculation.
            col.Item().Column(subject =>
            {
                subject.Item().Text("Objet :").FontColor(Muted);
                if (!string.IsNullOrWhiteSpace(invoice.VehicleDescription))
                {
                    subject.Item().Text(invoice.VehicleDescription);
                }

                subject.Item().Text(invoice.VehiclePlate);
            });

            col.Item().Element(c => LinesTable(c, invoice));
            col.Item().AlignRight().Width(290).Element(c => Totals(c, invoice));

            if (invoice.PricesExcludingVat)
            {
                col.Item().Element(c => TaxSummary(c, invoice));
            }

            // Remarques et conditions ensemble (jamais coupées entre deux pages).
            col.Item().ShowEntire().Column(notes =>
            {
                notes.Item().Text("Remarques").FontSize(11).FontColor(Muted);
                notes.Item().PaddingTop(2).Text("Merci de votre confiance.").FontSize(8.5f);
                notes.Item().PaddingTop(8).Text("Conditions d'utilisation").FontSize(11).FontColor(Muted);
                notes.Item().PaddingTop(2).Text(PaymentTerms).FontSize(8);
            });
        });
    }

    private static void InfoRow(IContainer container, string label, string value) =>
        container.Row(row =>
        {
            row.RelativeItem().AlignRight().PaddingRight(16).Text(label).FontColor(Muted);
            row.ConstantItem(90).AlignRight().Text(value);
        });

    /// <summary>Lignes : # · article et description · quantité · prix unitaire · TVA (montant et taux) · montant.</summary>
    private static void LinesTable(IContainer container, InvoicePdfModel invoice)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(24);
                columns.RelativeColumn();
                columns.ConstantColumn(55);
                columns.ConstantColumn(62);
                columns.ConstantColumn(62);
                columns.ConstantColumn(70);
            });

            table.Header(header =>
            {
                IContainer Cell(IContainer c) => c.Background(Band).PaddingVertical(7).PaddingHorizontal(4);
                header.Cell().Element(Cell).AlignCenter().Text("#").FontColor(Colors.White);
                header.Cell().Element(Cell).Text("Article & Description").FontColor(Colors.White);
                header.Cell().Element(Cell).AlignRight().Text("Quantité").FontColor(Colors.White);
                header.Cell().Element(Cell).AlignRight().Text("Taux").FontColor(Colors.White);
                header.Cell().Element(Cell).AlignRight().Text("Taxe").FontColor(Colors.White);
                header.Cell().Element(Cell).AlignRight().Text("Montant").FontColor(Colors.White);
            });

            var number = 0;
            foreach (var line in invoice.Lines)
            {
                number++;
                IContainer Cell(IContainer c) => c.BorderBottom(0.75f).BorderColor(Rule).PaddingVertical(7).PaddingHorizontal(4);

                table.Cell().Element(Cell).AlignCenter().Text(number.ToString(French));
                table.Cell().Element(Cell).Column(c =>
                {
                    c.Item().Text(line.Label);
                    if (!string.IsNullOrWhiteSpace(line.Description))
                    {
                        c.Item().Text(line.Description).FontSize(8).FontColor(Muted);
                    }

                    if (line.DiscountPercent is decimal discount)
                    {
                        c.Item().PaddingTop(2).Text($"{line.DiscountLabel} : remise -{discount.ToString("0.##", French)} %").FontSize(8).SemiBold();
                    }
                });
                table.Cell().Element(Cell).AlignRight().Text(Number(line.Quantity));
                table.Cell().Element(Cell).AlignRight().Text(Number(line.UnitPrice));

                if (invoice.PricesExcludingVat)
                {
                    var tax = Math.Round(line.Total * invoice.VatRate, 2, MidpointRounding.AwayFromZero);
                    table.Cell().Element(Cell).AlignRight().Column(c =>
                    {
                        c.Item().AlignRight().Text(Number(tax));
                        c.Item().AlignRight().Text($"{invoice.VatRate * 100:0.00} %").FontSize(8).FontColor(Muted);
                    });
                }
                else
                {
                    // Anciennes factures : prix TTC, TVA détaillée seulement dans les totaux.
                    table.Cell().Element(Cell).AlignRight().Text("-");
                }

                table.Cell().Element(Cell).AlignRight().Text(Number(line.Total));
            }
        });
    }

    /// <summary>Sous-total HT, TVA, total TTC, règlements reçus, solde dû.</summary>
    private static void Totals(IContainer container, InvoicePdfModel invoice)
    {
        container.Column(col =>
        {
            col.Item().BorderBottom(0.75f).BorderColor(Rule).PaddingVertical(5).Row(row =>
            {
                row.RelativeItem().AlignRight().PaddingRight(16).Text("Sous-total HT").Bold();
                row.ConstantItem(80).AlignRight().Text(Number(invoice.TotalHt));
            });
            col.Item().BorderBottom(0.75f).BorderColor(Rule).PaddingVertical(5).Row(row =>
            {
                row.RelativeItem().AlignRight().PaddingRight(16).Text($"TVA ({invoice.VatRate * 100:0} %)");
                row.ConstantItem(80).AlignRight().Text(Number(invoice.TotalVat));
            });
            col.Item().PaddingVertical(7).Row(row =>
            {
                row.RelativeItem().AlignRight().PaddingRight(16).Text("Total").Bold().FontSize(11);
                row.ConstantItem(80).AlignRight().Text(Euro(invoice.TotalTtc)).Bold().FontSize(11);
            });

            foreach (var payment in invoice.Payments)
            {
                col.Item().PaddingVertical(3).Row(row =>
                {
                    row.RelativeItem().AlignRight().PaddingRight(16)
                        .Text($"Réglé le {payment.PaidAtLocal.ToString("dd-MM-yyyy", French)} ({payment.Method})").FontColor(Muted);
                    row.ConstantItem(80).AlignRight().Text($"- {Euro(payment.Amount)}").FontColor(Muted);
                });
            }

            col.Item().PaddingTop(4).Background(Shade).PaddingVertical(9).Row(row =>
            {
                row.RelativeItem().AlignRight().PaddingRight(16).Text("Solde dû").Bold().FontSize(11);
                row.ConstantItem(80).PaddingRight(6).AlignRight().Text(Euro(invoice.Remaining)).Bold().FontSize(11);
            });
        });
    }

    /// <summary>Résumé de la TVA : base, montant de la taxe, total.</summary>
    private static void TaxSummary(IContainer container, InvoicePdfModel invoice)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(6).Text("Taxe Résumé").FontSize(11).FontColor(Muted);
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(165);
                    columns.ConstantColumn(100);
                    columns.ConstantColumn(100);
                });

                table.Header(header =>
                {
                    IContainer Cell(IContainer c) => c.Background(Band).PaddingVertical(6).PaddingHorizontal(6);
                    header.Cell().Element(Cell).Text("Taxe Détails").FontColor(Colors.White);
                    header.Cell().Element(Cell).AlignRight().Text("Montant soumis aux taxes (€)").FontColor(Colors.White);
                    header.Cell().Element(Cell).AlignRight().Text("Taxe Montant (€)").FontColor(Colors.White);
                    header.Cell().Element(Cell).AlignRight().Text("Montant total (€)").FontColor(Colors.White);
                });

                IContainer Row(IContainer c) => c.BorderBottom(0.75f).BorderColor(Rule).PaddingVertical(6).PaddingHorizontal(6);
                table.Cell().Element(Row).Text($"TVA ({invoice.VatRate * 100:0} %)");
                table.Cell().Element(Row).AlignRight().Text(Number(invoice.TotalHt));
                table.Cell().Element(Row).AlignRight().Text(Number(invoice.TotalVat));
                table.Cell().Element(Row).AlignRight().Text(Number(invoice.TotalTtc));

                table.Cell().Element(Row).Text("Total").Bold();
                table.Cell().Element(Row).AlignRight().Text(Euro(invoice.TotalHt)).Bold();
                table.Cell().Element(Row).AlignRight().Text(Euro(invoice.TotalVat)).Bold();
                table.Cell().Element(Row).AlignRight().Text(Euro(invoice.TotalTtc)).Bold();
            });
        });
    }

    // ------------------------------------------------------------
    // Pied de page : société, adresse, SIRET (+ pages)
    // ------------------------------------------------------------

    private static void Footer(IContainer container, TenantLegal legal)
    {
        container.BorderTop(0.75f).BorderColor(Band).PaddingTop(6).Column(col =>
        {
            col.Item().AlignCenter().Text(legal.CompanyName).Bold().FontSize(10);
            col.Item().AlignCenter().Text(legal.Address).FontColor(Muted);
            col.Item().AlignCenter().Text($"Siret {legal.Siret}").FontColor(Muted);
            col.Item().AlignRight().Text(text =>
            {
                text.DefaultTextStyle(x => x.FontSize(7.5f).FontColor(Muted));
                text.CurrentPageNumber();
                text.Span(" / ");
                text.TotalPages();
            });
        });
    }

    /// <summary>Contenu du logo SVG (chemin relatif au dossier de l'API), ou null.</summary>
    private static string? LogoSvg(string? file)
    {
        if (string.IsNullOrWhiteSpace(file))
        {
            return null;
        }

        var path = Path.IsPathRooted(file) ? file : Path.Combine(AppContext.BaseDirectory, file);
        return File.Exists(path) ? File.ReadAllText(path) : null;
    }
}
