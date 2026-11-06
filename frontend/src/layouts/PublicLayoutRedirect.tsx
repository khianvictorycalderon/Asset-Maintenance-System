import { useEffect, useState } from "react";
import http from "../utils/http";
import { setCsrfToken } from "../utils/csrf";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { BUILT_IN_API_URLS, PRIVATE_ROUTE_FIRST_PATH } from "../config";
import Footer from "../components/Footer";
import Loading from "../components/Loading";

export default function PublicLayoutRedirect() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await http.get(BUILT_IN_API_URLS.verify, {
          withCredentials: true,
        });
        setIsAuth(res.data.authenticated);
        if (res.data.authenticated) {
          setCsrfToken(res.data.csrf_token);
        }
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return <Loading/>
  }

  if (isAuth) {
    return <Navigate to={PRIVATE_ROUTE_FIRST_PATH} replace />;
  }

  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}