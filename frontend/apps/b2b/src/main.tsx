import type { ApiClient } from '@atelio/core/data'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { BrandContext } from './brand/BrandContext.tsx'
import { currentBrand } from './brand/current-brand.ts'
import ErrorPage from './components/ErrorPage.tsx'
import Layout from './components/Layout.tsx'
import UnknownSitePage from './components/UnknownSitePage.tsx'
import AppointmentsPage from './features/appointments/AppointmentsPage.tsx'
import TeamPage from './features/team/TeamPage.tsx'
import { appointmentsLoader } from './features/appointments/appointments-loader.ts'
import { interventionLoader } from './features/interventions/intervention-loader.ts'
import { interventionStatusesLoader } from './features/interventions/intervention-statuses-loader.ts'
import InterventionsPage from './features/interventions/InterventionsPage.tsx'
import InterventionPage from './features/interventions/InterventionPage.tsx'
import { invoiceLoader } from './features/invoices/invoice-loader.ts'
import InvoicePage from './features/invoices/InvoicePage.tsx'
import { garagesLoader } from './garage/garages-loader.ts'
import { apiClientFor } from './lib/api.ts'
import './index.css'

function createRouter(api: ApiClient) {
  return createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      loader: garagesLoader(api),
      errorElement: <ErrorPage />,
      children: [
        {
          errorElement: <ErrorPage />,
          children: [
            { index: true, element: <Navigate to="/rendez-vous" replace /> },
            { path: 'rendez-vous', element: <AppointmentsPage />, loader: appointmentsLoader(api) },
            { path: 'interventions', element: <InterventionsPage />, loader: interventionStatusesLoader(api) },
            { path: 'interventions/:id', element: <InterventionPage />, loader: interventionLoader(api) },
            { path: 'factures/:id', element: <InvoicePage />, loader: invoiceLoader(api) },
            { path: 'equipes', element: <TeamPage /> },
            { path: '*', element: <ErrorPage /> },
          ],
        },
      ],
    },
  ])
}

const root = createRoot(document.getElementById('root')!)

if (!currentBrand) {
  root.render(<UnknownSitePage />)
} else {
  // La marque est fixée par le domaine : le router et le client API sont créés une seule fois.
  const brand = { brand: currentBrand, api: apiClientFor(currentBrand) }
  const router = createRouter(brand.api)

  root.render(
    <StrictMode>
      <BrandContext value={brand}>
        <RouterProvider router={router} />
      </BrandContext>
    </StrictMode>,
  )
}
