using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Atelio.Application.Common;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);

            var failures = _validators
                .Select(v => v.Validate(context))
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            if (failures.Count > 0)
            {
                throw new ValidationException(failures);
            }
        }

        return await next(cancellationToken);
    }
}

public class RequestPipelineBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<RequestPipelineBehavior<TRequest, TResponse>> _logger;

    public RequestPipelineBehavior(ILogger<RequestPipelineBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation("Start request: {RequestName}", requestName);

        try
        {
            var response = await next(cancellationToken);

            _logger.LogInformation(
                "Finished request: {RequestName} in {ElapsedMs} ms",
                requestName,
                stopwatch.ElapsedMilliseconds);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error in request: {RequestName} after {ElapsedMs} ms",
                requestName,
                stopwatch.ElapsedMilliseconds);

            throw;
        }
    }
}
