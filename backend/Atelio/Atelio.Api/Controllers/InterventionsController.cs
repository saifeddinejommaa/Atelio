using Atelio.Application.Features.Interventions.Commands;
using Atelio.Application.Features.Invoices.Commands;
using Atelio.Application.Features.Interventions.Repositories;
using Atelio.Application.Features.Interventions.Requests;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterventionsController : ControllerBase
{
    private readonly IInterventionQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public InterventionsController(IInterventionQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    /// <summary>
    /// Interventions du garage, des plus récentes aux plus anciennes, par pages (total inclus).
    /// Page de 20 : GET /api/interventions?garageId=2&amp;statusId=2&amp;customer=dupont&amp;plate=AB123&amp;date=2026-10-06&amp;page=1
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] InterventionsRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetInterventionsAsync(filter, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Change le mécanicien chargé de l'intervention (mécanicien actif du même garage).</summary>
    [HttpPut("{id:long}/employee")]
    public async Task<IActionResult> AssignEmployee(long id, [FromBody] AssignEmployeeRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new AssignInterventionEmployeeCommand { InterventionId = id, EmployeeId = request.EmployeeId },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Travaux terminés : l'intervention est prête, le mécanicien est libéré.</summary>
    [HttpPost("{id:long}/finish")]
    public async Task<IActionResult> Finish(long id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new FinishInterventionCommand { InterventionId = id }, cancellationToken);

        return NoContent();
    }

    /// <summary>Émet la facture de l'intervention prête. Renvoie { invoiceId }.</summary>
    [HttpPost("{id:long}/invoice")]
    public async Task<IActionResult> Invoice(long id, CancellationToken cancellationToken)
    {
        var invoiceId = await _mediator.Send(new IssueInvoiceCommand { InterventionId = id }, cancellationToken);

        return Ok(new { invoiceId });
    }

    /// <summary>
    /// Main-d'œuvre d'une prestation (ex. « Autre ») : { labourMinutes, categoryId }.
    /// Le prix devient taux horaire de la catégorie × temps.
    /// </summary>
    [HttpPut("{id:long}/services/{serviceId:long}")]
    public async Task<IActionResult> UpdateServiceLabour(
        long id, long serviceId, [FromBody] UpdateServiceLabourRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new UpdateServiceLabourCommand
            {
                InterventionId = id,
                ServiceId = serviceId,
                LabourMinutes = request.LabourMinutes,
                CategoryId = request.CategoryId,
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Ajoute une pièce : { reference?, name, quantity, unitPrice (TTC) }. Renvoie { id }.</summary>
    [HttpPost("{id:long}/spare-parts")]
    public async Task<IActionResult> AddSparePart(long id, [FromBody] SparePartInput request, CancellationToken cancellationToken)
    {
        var partId = await _mediator.Send(
            new AddSparePartCommand
            {
                InterventionId = id,
                Reference = request.Reference,
                Name = request.Name,
                Quantity = request.Quantity,
                UnitPrice = request.UnitPrice,
            },
            cancellationToken);

        return Ok(new { id = partId });
    }

    [HttpPut("{id:long}/spare-parts/{partId:long}")]
    public async Task<IActionResult> UpdateSparePart(long id, long partId, [FromBody] SparePartInput request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new UpdateSparePartCommand
            {
                InterventionId = id,
                SparePartId = partId,
                Reference = request.Reference,
                Name = request.Name,
                Quantity = request.Quantity,
                UnitPrice = request.UnitPrice,
            },
            cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:long}/spare-parts/{partId:long}")]
    public async Task<IActionResult> DeleteSparePart(long id, long partId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteSparePartCommand { InterventionId = id, SparePartId = partId }, cancellationToken);

        return NoContent();
    }
}
