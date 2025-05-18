import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function RoleSelection() {
  const navigate = useNavigate();

  const goToSignInPage = () => {
    const roleElement = document.getElementById(
      "role"
    ) as HTMLSelectElement | null;
    const role = roleElement ? roleElement.value : null;
    if (role === "admin") {
      navigate("/admin-signin");
    } else if (role === "manager") {
      navigate("/manager-signin");
    } else if (role === "employee") {
      navigate("/employee-signin");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100
    ">
      <div className="text-center bg-white p-[30px] rounded-lg shadow-lg w-[380px] border-t-4 border-black">
        <img src={logo} alt="App Logo" className="w-24 mx-auto mb-4" />
        <h2 className="text-[28px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-black mb-2">
          Welcome to ShiftEase App
        </h2>
        <p className="text-gray-600 text-lg mb-4">
          Please select your role to continue:
        </p>
        <select
          id="role"
          className="w-full px-3 py-2 mb-4 border border-black rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="admin">I am an Admin</option>
          <option value="manager">I am a Manager</option>
          <option value="employee">I am an Employee</option>
        </select>
        <button
          onClick={goToSignInPage}
          className="w-full py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
