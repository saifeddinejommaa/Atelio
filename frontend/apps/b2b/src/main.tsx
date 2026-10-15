import type { ApiClient } from '@atelio/core/data'
import type { Brand } from '@atelio/core/domain'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { BrandContext } from './brand/BrandContext.tsx'
import { currentBrand } from './brand/CurrentBrand'
import { applyBrandToDocument, themeStyle } from './brand/BrandTheme'
import DeferredRoute from './components/DeferredRoute.tsx'
import ErrorPage from './components/ErrorPage.tsx'
import LoadingState from './components/LoadingState.tsx'
import SignInPage from './components/SignInPage.tsx'
import Layout from './components/Layout.tsx'
import UnknownSitePage from './components/UnknownSitePage.tsx'
import AppointmentsPage from './features/appointments/AppointmentsPage.tsx'
import { articlesLoader } from './features/articles/ArticlesLoader'
import ArticlesPage from './features/articles/ArticlesPage.tsx'
import { promotionsLoader } from './features/promotions/PromotionsLoader'
import PromotionsPage from './features/promotions/PromotionsPage.tsx'
import { servicesLoader } from './features/services/ServicesLoader'
import ServicesPage from './features/services/ServicesPage.tsx'
import { customerLoader } from './features/customers/CustomerLoader'
import CustomerPage from './features/customers/CustomerPage.tsx'
import CustomersPage from './features/customers/CustomersPage.tsx'
import { quoteLoader } from './features/quotes/QuoteLoader'
import QuotePage from './features/quotes/QuotePage.tsx'
import TeamPage from './features/team/TeamPage.tsx'
import { appointmentsLoader } from './features/appointments/AppointmentsLoader'
import { interventionLoader } from './features/interventions/InterventionLoader'
import { interventionStatusesLoader } from './features/interventions/InterventionStatusesLoader'
import InterventionsPage from './features/interventions/InterventionsPage.tsx'
import InterventionPage from './features/interventions/InterventionPage.tsx'
import { invoiceLoader } from './features/invoices/InvoiceLoader'
import InvoicePage from './features/invoices/InvoicePage.tsx'
import InvoicesPage from './features/invoices/InvoicesPage.tsx'
import { garagesLoader } from './garage/GaragesLoader'
import { apiClientFor } from './lib/api.ts'
import { deferred } from './lib/deferred.ts'
import { startAuth } from './lib/auth.ts'
import './index.css'

function createRouter(api: ApiClient, brand: Brand) {
  return createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      // Personne connectée et garages de la marque : le cadre (menu, compte) s'affiche sans les attendre.
      loader: deferred(garagesLoader(api)),
      // Démarrage : affiché le temps que les loaders (différés) rendent la main, soit un instant.
      hydrateFallbackElement: (
        <div style={themeStyle(brand)} className="flex min-h-screen items-center justify-center bg-muted font-sans">
          <LoadingState message="Chargement de l'espace pro…" />
        </div>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          errorElement: <ErrorPage />,
          children: [
            { index: true, element: <Navigate to="/rendez-vous" replace /> },
            {
              path: 'rendez-vous',
              element: (
                <DeferredRoute title="Rendez-vous" message="Chargement du planning…">
                  <AppointmentsPage />
                </DeferredRoute>
              ),
              loader: deferred(appointmentsLoader(api)),
            },
            {
              path: 'interventions',
              element: (
                <DeferredRoute title="Interventions" message="Chargement des interventions…">
                  <InterventionsPage />
                </DeferredRoute>
              ),
              loader: deferred(interventionStatusesLoader(api)),
            },
            {
              path: 'interventions/:id',
              element: (
                <DeferredRoute title="Intervention" message="Chargement de l'intervention…">
                  <InterventionPage />
                </DeferredRoute>
              ),
              loader: deferred(interventionLoader(api)),
            },
            { path: 'factures', element: <InvoicesPage /> },
            {
              path: 'factures/:id',
              element: (
                <DeferredRoute title="Facture" message="Chargement de la facture…">
                  <InvoicePage />
                </DeferredRoute>
              ),
              loader: deferred(invoiceLoader(api)),
            },
            { path: 'clients', element: <CustomersPage /> },
            {
              path: 'clients/:id',
              element: (
                <DeferredRoute title="Client" message="Chargement du client…">
                  <CustomerPage />
                </DeferredRoute>
              ),
              loader: deferred(customerLoader(api)),
            },
            {
              path: 'devis/:id',
              element: (
                <DeferredRoute title="Devis" message="Chargement du devis…">
                  <QuotePage />
                </DeferredRoute>
              ),
              loader: deferred(quoteLoader(api)),
            },
            {
              path: 'articles',
              element: (
                <DeferredRoute title="Articles" message="Chargement des articles…">
                  <ArticlesPage />
                </DeferredRoute>
              ),
              loader: deferred(articlesLoader(api)),
            },
            {
              path: 'promotions',
              element: (
                <DeferredRoute title="Promotions" message="Chargement des promotions…">
                  <PromotionsPage />
                </DeferredRoute>
              ),
              loader: deferred(promotionsLoader(api)),
            },
            {
              path: 'prestations',
              element: (
                <DeferredRoute title="Prestations" message="Chargement des prestations…">
                  <ServicesPage />
                </DeferredRoute>
              ),
              loader: deferred(servicesLoader(api)),
            },
            { path: 'equipes', element: <TeamPage /> },
            { path: '*', element: <ErrorPage /> },
          ],
        },
      ],
    },
  ])
}

const root = createRoot(document.getElementById('root')!)

async function start() {
  if (!currentBrand) {
    root.render(<UnknownSitePage />)
    return
  }

  // Renouvellement silencieux du jeton Microsoft : MSAL recharge cette page dans une iframe cachée.
  // L'app ne doit pas y démarrer, sinon elle bloque le renouvellement (block_iframe_reload).
  if (window.self !== window.top) return

  // Logo et nom de la marque dans l'onglet dès l'écran de connexion.
  applyBrandToDocument(currentBrand)

  // Connexion Microsoft (personnel du garage) avant d'afficher le back-office.
  const auth = await startAuth()
  if (auth.status !== 'signed-in') {
    root.render(<SignInPage brand={currentBrand} onSignIn={auth.status === 'signed-out' ? auth.login : undefined} />)
    return
  }

  // La marque est fixée par le domaine : le router et le client API sont créés une seule fois.
  const { session } = auth
  const brand = {
    brand: currentBrand,
    api: apiClientFor(currentBrand, session.getToken),
    accountName: session.account.name ?? session.account.username,
    signOut: session.logout,
  }
  const router = createRouter(brand.api, currentBrand)

  root.render(
    <StrictMode>
      <BrandContext value={brand}>
        <RouterProvider router={router} />
      </BrandContext>
    </StrictMode>,
  )
}

void start()
