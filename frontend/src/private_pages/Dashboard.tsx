import axios from "axios";
import { useEffect } from "react";
import { ROLE_BASED_API_URLS } from "../config";
import DashboardStatCard from "../components/Dashboard/StatCard";
import { BriefcaseBusiness, CalendarCheck, Users, Wallet } from "lucide-react";
import DashboardChart from "../components/Dashboard/Chart";

export default function Dashboard() {

    const handleFetchData = async() => {
      try {
        const res = await axios.get(`${ROLE_BASED_API_URLS.Employee}/test`, { withCredentials: true });
        console.log(`Backend response: ${res.data.message}`);
      } catch (e: unknown) {
        console.error(`Failed to fetch Role-Based API test URLs: ${String(e)}`);
      }
    }

    useEffect(() => {
      handleFetchData();
    }, []);

    // -----------------------------------------------------
    // SAMPLE DATA ONLY

    const employeeGrowthData = {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
      ],
      datasets: [
        {
          label: "New Employees",
          data: [
            12,
            19,
            15,
            25,
            32,
            40,
          ],
          backgroundColor: "#2563eb",
          borderColor: "#2563eb",
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };


    const departmentData = {
      labels: [
        "IT",
        "HR",
        "Finance",
        "Marketing",
      ],
      datasets: [
        {
          label: "Employees",
          data: [
            40,
            20,
            25,
            15,
          ],
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#f59e0b",
            "#9333ea",
          ],
          borderWidth: 2,
        },
      ],
    };


    const attendanceData = {
      labels: [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
      ],
      datasets: [
        {
          label: "Attendance Rate",
          data: [
            95,
            92,
            98,
            90,
            97,
          ],
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,.2)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    };


    const performanceData = {
      labels: [
        "Excellent",
        "Good",
        "Average",
        "Poor",
      ],
      datasets: [
        {
          label: "Employees",
          data: [
            30,
            50,
            15,
            5,
          ],
          backgroundColor: [
            "#16a34a",
            "#2563eb",
            "#f59e0b",
            "#ef4444",
          ],
          borderWidth: 2,
        },
      ],
    };

    // -----------------------------------------------------

    return (
      <>
        {/* SAMPLE USAGES ONLY, DATA MUST COME FROM THE BACKEND */}

        {/* STATS CARD SECTION */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            title="Total Employees"
            value={248}
            icon={<Users className="h-6 w-6" />}
            trend="-3.1% this month"
          />

          <DashboardStatCard
            title="Departments"
            value={12}
            icon={<BriefcaseBusiness className="h-6 w-6" />}
            trend="+2 new"
          />

          <DashboardStatCard
            title="Monthly Payroll"
            value="₱1,284,500"
            icon={<Wallet className="h-6 w-6" />}
            trend="+5.3%"
          />

          <DashboardStatCard
            title="Attendance Today"
            value="231 / 248"
            icon={<CalendarCheck className="h-6 w-6" />}
            trend="93.1%"
          />
        </div>

        {/* CHARTS CARD SECTION */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

          <DashboardChart
            title="Employee Growth"
            types={[
              "bar",
              "line",
              "radar",
            ]}
            defaultType="bar"
            data={employeeGrowthData}
          />


          <DashboardChart
            title="Department Distribution"
            types={[
              "doughnut",
              "pie",
              "polarArea",
            ]}
            defaultType="doughnut"
            data={departmentData}
          />


          <DashboardChart
            title="Weekly Attendance"
            types={[
              "line",
              "bar",
            ]}
            defaultType="line"
            data={attendanceData}
          />


          <DashboardChart
            title="Employee Performance"
            types={[
              "bar",
              "pie",
              "doughnut",
            ]}
            defaultType="bar"
            filters={[
              {
                label: "All Departments",
                value: "all",
              },
              {
                label: "IT",
                value: "it",
              },
              {
                label: "HR",
                value: "hr",
              },
            ]}
            data={performanceData}
          />

        </div>

      </>
    );
}