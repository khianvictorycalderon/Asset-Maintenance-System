import { useEffect, useState } from "react";
import axios from "axios";

import {
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  BUILT_IN_API_URLS,
  SIDEBAR_BUTTONS,
  type UserRole,
} from "../config";

import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import Loading from "../components/Loading";
import PrivateFooter from "../components/PrivateFooter";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, updateUser } from "../slices/userSlice";
import { type RootState } from "../config/store";
import { useSignalREvent } from "../utils/useSignalREvent";

export default function PrivateLayout() {
  const [loading, setLoading] = useState(true);

  const user = useSelector((state: RootState) => state.user);

  const [isAuth, setIsAuth] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const location = useLocation();

  const checkAuth = async () => {
    try {
      const res = await axios.get(
        BUILT_IN_API_URLS.verify,
        {
          withCredentials: true,
        }
      );

      return res.data.authenticated;
    } catch {
      return(false);
    } 
  };

  // User state management
  const dispatch = useDispatch();
  const loadUserData = async () => {
    try {
      const res = await axios.get(
        BUILT_IN_API_URLS.getUserData,
        {
          withCredentials: true
        }
      );
      dispatch(updateUser(res.data.user));
    } catch {
      dispatch(clearUser());
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const authenticated = await checkAuth();

      if (!authenticated) {
        setIsAuth(false);
        setLoading(false);
        return;
      }

      setIsAuth(true);

      await loadUserData();

      setLoading(false);
    };

    initialize();
  }, []);

  useSignalREvent(
    "LoggedOut",
    async () => {
      const authenticated = await checkAuth();
      setIsAuth(authenticated);
    }
  );

  if (loading) {
    return <Loading />;
  }

  if (!isAuth || !user.id || !user.email) {
    return <Navigate to="/login" replace />;
  }

  // ROLE CHECK
  const allowedRoute = SIDEBAR_BUTTONS.find(
    (item) =>
      item.path === location.pathname
  );

  if (
    allowedRoute &&
    !allowedRoute.roles.includes(user.role as UserRole)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen flex flex-col">

      <TopNav
        onMenuClick={() =>
          setSidebarOpen(true)
        }
      />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 bg-neutral-100 dark:bg-neutral-900">
          <Outlet />
          <PrivateFooter />
        </main>

      </div>

    </div>
  );
}