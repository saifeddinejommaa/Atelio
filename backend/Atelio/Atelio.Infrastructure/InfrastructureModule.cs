using Atelio.Application.Common;
using Atelio.Infrastructure.Persistence;
using Atelio.Infrastructure.Persistence.Repositories;
using Atelio.Infrastructure.Tenancy;
using Autofac;

namespace Atelio.Infrastructure;

public class InfrastructureModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        var assembly = typeof(CustomerRepository).Assembly;

        // Repositories (écriture EF Core) et query repositories (lecture Dapper)
        builder.RegisterAssemblyTypes(assembly)
            .Where(t => t.Name.EndsWith("Repository"))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();

        builder.RegisterType<UnitOfWork>()
            .As<IUnitOfWork>()
            .InstancePerLifetimeScope();

        // Marque blanche de la requête : une instance par requête HTTP.
        builder.RegisterType<TenantContext>()
            .AsSelf()
            .As<ITenantContext>()
            .InstancePerLifetimeScope();
    }
}
