import { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function AdminSignUp() {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
    } catch {
      setError("Sign-up failed. Please try again.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        // Activate the session
        await setActive({ session: signUpAttempt.createdSessionId });

        // Add admin to the database
        const token = signUpAttempt.createdSessionId; // Use the session token for authentication
        try {
          const response = await fetch("/api/admin", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Admin User", // Add a default name or collect it during sign-up
              email: emailAddress,
              position: "Admin", // Specify the admin position
              organizationId: null,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add admin to the database");
          }
        } catch (error) {
          console.error("Error adding admin to the database:", error);
        }

        // Redirect to the dashboard
        navigate("/dashboard");
      } else {
        setError("Verification failed. Please check your code and try again.");
      }
    } catch {
      setError("Invalid verification code.");
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center bg-white p-[30px] rounded-lg shadow-lg w-[380px] border-t-4 border-black">
          <img src={logo} alt="App Logo" className="w-24 mx-auto mb-4" />
          <h2 className="text-[28px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-black mb-4">Verify Email</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleVerify}>
            <label htmlFor="code">Enter Verification Code</label>
            <input
              id="code"
              name="code"
              type="text"
              className="w-full px-3 py-2 mb-4 border border-black rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="submit"
              className="w-full py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <div className="text-center bg-white p-[30px] rounded-lg shadow-lg w-[380px] border-t-4 border-black">
        <img src={logo} alt="App Logo" className="w-24 mx-auto mb-4" />
        <h2 className="text-[28px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-black mb-4">Admin Sign-Up</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Enter Email Address</label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 mb-4 border border-black rounded"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
          <label htmlFor="password">Enter Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 mb-4 border border-black rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
