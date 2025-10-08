import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Svg from "../../assets/Computer login-amico (1).svg";
import icon from "../../assets/icon.svg";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col justify-center items-end px-6 md:px-12 py-12">
        <div className="w-full max-w-sm sm:max-w-md bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
          {/* Logo + Brand */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={icon} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-2xl sm:text-3xl text-blue-500 font-semibold">Actowiz</h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-100">
            Sign In
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 font-medium text-gray-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-gray-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition"
            >
              Sign In
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex md:flex-1 items-center  p-6 bg-gray-900">
        <img
          src={Svg}
          alt="Login Illustration"
          className="object-contain max-h-[60vh] w-full"
        />
      </div>
    </div>
  );
}
