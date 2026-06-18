import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:8080/api/auth/register', formData);
            if (response.status === 200 || response.status === 201) {
                alert('Đăng ký thành công!');
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.');
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3M9 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-4c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">BandHub Studio</h1>
                        <p className="text-xs text-emerald-400/70 tracking-wider uppercase">Workspace Management</p>
                    </div>
                </div>

                <div className="max-w-xl my-auto space-y-6">
                    <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Đặt phòng tập <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Tạo tài khoản để đặt phòng nhanh, theo dõi lịch tập và nhận ưu đãi thành viên.
                    </p>
                    <div className="space-y-3 pt-2 text-sm text-gray-200">
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Đặt phòng nhanh trong vòng 30 giây</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Quản lý lịch đặt và thông tin tài khoản dễ dàng</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Nhận hỗ trợ từ đội ngũ vận hành 24/7</span>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-400/50 tracking-wide">
                    © 2026 BandHub Studio. All rights reserved.
                </div>
            </div>

            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-1/2 py-2 text-xs font-semibold text-gray-500 rounded-lg hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                        <button
                            type="button"
                            className="w-1/2 py-2 text-xs font-semibold text-gray-800 bg-white shadow-sm rounded-lg"
                        >
                            Đăng ký
                        </button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo tài khoản</h3>
                        <p className="text-xs text-gray-400 mt-1">Điền thông tin để bắt đầu sử dụng dịch vụ.</p>
                    </div>

                    {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormInput
                            label="Họ và tên"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            icon="user"
                        />
                        <FormInput
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@company.com"
                            icon="email"
                        />
                        <FormInput
                            label="Số điện thoại"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0912345678"
                            icon="phone"
                        />
                        <FormInput
                            label="Mật khẩu"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 6 ký tự"
                            icon="lock"
                        />

                        <button
                            type="submit"
                            className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]"
                        >
                            <span className="text-sm">Tạo tài khoản</span>
                        </button>
                    </form>

                    <div className="text-center mt-6 text-xs text-gray-500">
                        Đã có tài khoản?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-brand-orange font-semibold hover:underline cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

type FormInputProps = {
    label: string;
    name: string;
    type: string;
    value: string;
    placeholder: string;
    icon: 'user' | 'email' | 'phone' | 'lock';
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function FormInput({ label, name, type, value, placeholder, icon, onChange }: FormInputProps) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <InputIcon icon={icon} />
                </div>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                />
            </div>
        </div>
    );
}

function InputIcon({ icon }: { icon: FormInputProps['icon'] }) {
    const paths = {
        user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        phone: 'M2 5.5C2 4.12 3.12 3 4.5 3h1.13c.74 0 1.38.5 1.56 1.22l.5 2a2 2 0 01-.52 1.89l-.67.67a12 12 0 005.72 5.72l.67-.67a2 2 0 011.89-.52l2 .5A1.6 1.6 0 0118 15.37v1.13c0 1.38-1.12 2.5-2.5 2.5H15C7.82 19 2 13.18 2 6v-.5z',
        lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    };

    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
        </svg>
    );
}
