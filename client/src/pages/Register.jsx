import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm w-80 space-y-4">
        <h1 className="text-xl font-semibold text-center">Create account</h1>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <input name="name" placeholder="Full name" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <select name="role" onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Register</button>
        <p className="text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-blue-600">Log in</Link></p>
      </form>
    </div>
  );
}