using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Version PDF d'une facture, stockée dans Azure Blob Storage. Une nouvelle version à chaque règlement ;
// les précédentes sont conservées (jamais modifiées ni supprimées).
[Table("invoice_document")]
public class InvoiceDocument
{
    [Column("id")]
    public long Id { get; set; }

    [Column("invoice_id")]
    public long InvoiceId { get; set; }

    // 1, 2, 3...
    [Column("version")]
    public short Version { get; set; }

    // Chemin dans le conteneur de la marque (ex. « gmg »), ex. invoices/2026/F-2026-000051-v1.pdf.
    [Column("blob_path")]
    public string BlobPath { get; set; } = null!;

    // SHA-256 (hexadécimal) du fichier : prouve qu'il n'a pas été modifié.
    [Column("sha256")]
    public string Sha256 { get; set; } = null!;

    [Column("size_bytes")]
    public int SizeBytes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
