using Atelio.Application.Features.Invoices.Commands;
using Atelio.Application.Features.Invoices.Repositories;
using Atelio.Application.Features.Invoices.Requests;
using Atelio.Application.Common;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public InvoicesController(IInvoiceQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    /// <summary>
    /// Factures du garage, 20 par page, avec les totaux HT / TTC de toute la sélection :
    /// GET /api/invoices?garageId=2&amp;from=2026-10-01&amp;to=2026-10-31&amp;customer=dupont&amp;plate=AB123&amp;page=1
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] InvoicesRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetInvoicesAsync(filter, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Encaisse un règlement, total ou partiel : { method: card | cash | transfer | check, amount }.
    /// Une nouvelle version du PDF est générée avec les règlements à jour.
    /// </summary>
    [HttpPost("{id:long}/pay")]
    public async Task<IActionResult> Pay(long id, [FromBody] PayInvoiceRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new PayInvoiceCommand { InvoiceId = id, Method = request.Method, Amount = request.Amount }, cancellationToken);

        return NoContent();
    }

    /// <summary>PDF stocké de la facture : la dernière version, ou ?version=n.</summary>
    [HttpGet("{id:long}/pdf")]
    public async Task<IActionResult> Pdf(
        long id,
        [FromQuery] short? version,
        [FromServices] IInvoiceDocumentRepository documents,
        [FromServices] IDocumentStorage storage,
        [FromServices] ITenantContext tenant,
        CancellationToken cancellationToken)
    {
        var all = await documents.GetByInvoiceAsync(id, cancellationToken);
        var document = version is short v ? all.FirstOrDefault(d => d.Version == v) : all.FirstOrDefault();
        if (document is null)
        {
            return NotFound();
        }

        var content = await storage.OpenAsync(DocumentContainers.For(tenant), document.BlobPath, cancellationToken);
        if (content is null)
        {
            return NotFound();
        }

        // inline : le navigateur l'affiche (aperçu) ; le nom sert au téléchargement.
        Response.Headers.ContentDisposition = $"inline; filename=\"{Path.GetFileName(document.BlobPath)}\"";
        return File(content, "application/pdf");
    }

    /// <summary>Génère une nouvelle version du PDF avec l'état actuel (facture émise avant les PDF, ou échec de stockage).</summary>
    [HttpPost("{id:long}/documents")]
    public async Task<IActionResult> GenerateDocument(long id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new GenerateInvoiceDocumentCommand { InvoiceId = id }, cancellationToken);

        return NoContent();
    }
}
