import { useState } from "react";
import { useNavigate } from "react-router";
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
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Card Container */}
      <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-lg overflow-hidden max-w-5xl w-full">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={icon} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-2xl sm:text-3xl text-[#3903a0] font-semibold">
              Actowiz
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
            Sign In
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
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
        </div>

        {/* Right: Image */}
        <div className="w-full md:w-1/2 bg-blue-50 flex justify-center items-center p-6">
          <img
            src={Svg}
            alt="Login Illustration"
            className="object-contain max-h-[60vh] w-full"
          />
        </div>
      </div>
    </div>
  );
}
