import { useEffect, useState } from "react";
import axios from "axios";
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
        const res = await axios.get(BUILT_IN_API_URLS.verify, {
          withCredentials: true,
        });
        setIsAuth(res.data.authenticated);
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