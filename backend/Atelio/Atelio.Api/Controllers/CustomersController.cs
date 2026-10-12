using Atelio.Application.Common;
using Atelio.Application.Features.Customers.Commands;
using Atelio.Application.Features.Customers.Repositories;
using Atelio.Application.Features.Customers.Requests;
using Atelio.Application.Features.Quotes.Repositories;
using Atelio.Application.Features.Customers.Responses;
using Atelio.Application.Features.Vehicles.Responses;
using Atelio.Domain;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ICustomerQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public CustomersController(
        ICustomerRepository customerRepository,
        IVehicleRepository vehicleRepository,
        ICustomerQueryRepository queryRepository,
        IMediator mediator)
    {
        _customerRepository = customerRepository;
        _vehicleRepository = vehicleRepository;
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    /// <summary>
    /// Clients par nom, 20 par page : GET /api/customers?search=dupont&amp;page=1
    /// (search : nom, e-mail, téléphone ou immatriculation).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] CustomersRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetCustomersAsync(filter, cancellationToken));
    }

    /// <summary>Factures du client, des plus récentes aux plus anciennes.</summary>
    [HttpGet("{id:long}/invoices")]
    public async Task<IActionResult> GetInvoices(long id, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetInvoicesAsync(id, cancellationToken));
    }

    /// <summary>Devis du client, des plus récents aux plus anciens.</summary>
    [HttpGet("{id:long}/quotes")]
    public async Task<IActionResult> GetQuotes(long id, [FromServices] IQuoteQueryRepository quotes, CancellationToken cancellationToken)
    {
        return Ok(await quotes.GetByCustomerAsync(id, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(id, cancellationToken);

        return customer is null ? NotFound() : Ok(CustomerResponse.From(customer));
    }

    /// <summary>Recherche d'un client par e-mail (ex. après connexion).</summary>
    [HttpGet("by-email")]
    public async Task<IActionResult> GetByEmail([FromQuery] string email, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByEmailAsync(email, cancellationToken);

        return customer is null ? NotFound() : Ok(CustomerResponse.From(customer));
    }

    /// <summary>
    /// Clients dont le numéro correspond, quel que soit le format (ex. "06 12 34 56 78" ou "+33612345678").
    /// Plusieurs clients peuvent partager un numéro (famille) : renvoie une liste, vide si aucun.
    /// </summary>
    [HttpGet("by-phone")]
    public async Task<IActionResult> GetByPhone([FromQuery] string phone, CancellationToken cancellationToken)
    {
        var key = TextRules.PhoneKey(phone);
        if (key is null)
        {
            throw new BusinessException("Numéro de téléphone invalide.");
        }

        var customers = await _customerRepository.GetActiveByPhoneKeyAsync(key, cancellationToken);

        return Ok(customers.Select(CustomerResponse.From));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerCommand command, CancellationToken cancellationToken)
    {
        command.Id = id;

        return Ok(await _mediator.Send(command, cancellationToken));
    }

    /// <summary>Véhicules du client.</summary>
    [HttpGet("{id:long}/vehicles")]
    public async Task<IActionResult> GetVehicles(long id, CancellationToken cancellationToken)
    {
        var vehicles = await _vehicleRepository.GetActiveByCustomerAsync(id, cancellationToken);

        return Ok(vehicles.Select(VehicleResponse.From));
    }
}
