using Atelio.Application.Common;
using Autofac;
using FluentValidation;
using MediatR;
using System.Reflection;

namespace Atelio.Application;

public class ApplicationModule : Autofac.Module
{
    protected override void Load(ContainerBuilder builder)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Services
        builder.RegisterAssemblyTypes(assembly)
            .Where(t => t.Name.EndsWith("Service"))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

        // MediatR handlers
        builder.RegisterAssemblyTypes(assembly)
            .AsClosedTypesOf(typeof(IRequestHandler<,>))
            .AsImplementedInterfaces();

        // Validators
        builder.RegisterAssemblyTypes(assembly)
            .AsClosedTypesOf(typeof(IValidator<>))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

        builder.RegisterGeneric(typeof(ValidationBehavior<,>))
            .As(typeof(IPipelineBehavior<,>))
            .InstancePerLifetimeScope();
    }
}
