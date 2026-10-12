using Atelio.Application.Common;
using Atelio.Infrastructure.Auth;
using Atelio.Infrastructure.Documents;
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

        // Connexion des clients b2c : jetons et envoi du code.
        builder.RegisterType<CustomerTokenService>()
            .As<ICustomerTokenService>()
            .SingleInstance();

        builder.RegisterType<ConsoleEmailSender>()
            .As<IEmailSender>()
            .SingleInstance();

        // Factures PDF et leur stockage (Azure Blob Storage).
        builder.RegisterType<QuestPdfInvoiceRenderer>()
            .As<IInvoicePdfRenderer>()
            .SingleInstance();

        builder.RegisterType<BlobDocumentStorage>()
            .As<IDocumentStorage>()
            .SingleInstance();

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
