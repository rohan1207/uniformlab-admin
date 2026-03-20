import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import HomePage from "@/pages/HomePage";
import OrdersPage from "@/pages/OrdersPage";
import SchoolsPage from "@/pages/SchoolsPage";
import DeliveryPartnersPage from "@/pages/DeliveryPartnersPage";
import ProductsPage from "@/pages/ProductsPage";
import AddProductPage from "@/pages/AddProductPage";
import CustomersPage from "@/pages/CustomersPage";
import MarketingPage from "@/pages/MarketingPage";
import DiscountsPage from "@/pages/DiscountsPage";
import ContentPage from "@/pages/ContentPage";
import GlobalSeoPage from "@/pages/GlobalSeoPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import CreateOrderPage from "@/pages/CreateOrderPage";
import ExchangesPage from "@/pages/ExchangesPage";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "@/contexts/AuthContext";
import { OrdersCountProvider } from "@/contexts/OrdersCountContext";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <OrdersCountProvider>
                <AdminLayout />
              </OrdersCountProvider>
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="orders/create" element={<CreateOrderPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="delivery-partners" element={<DeliveryPartnersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<AddProductPage />} />
          <Route path="products/add/:schoolId" element={<AddProductPage />} />
          <Route path="products/edit/:id" element={<AddProductPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="exchanges" element={<ExchangesPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="discounts" element={<DiscountsPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="global-seo" element={<GlobalSeoPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
