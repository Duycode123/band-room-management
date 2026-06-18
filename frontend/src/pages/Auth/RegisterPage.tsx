import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            {/* CỘT TRÁI - BANNER MÀU XANH LÁ ĐẬM TỐI GIẢN (KHỚP 100% VỚI LOGIN) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16 relative overflow-hidden">
                {/* Logo tối giản */}
                <div className="flex items-center space-x-3 z-10">
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

                {/* Nội dung giới thiệu ở giữa */}
                <div className="max-w-xl my-auto z-10 space-y-6">
                    <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Đặt phòng tập <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Hơn 6 phòng tập chuyên nghiệp, đầy đủ trang thiết bị nhạc cụ hiện đại cùng hệ thống cách âm tiêu chuẩn quốc tế.
                    </p>

                    {/* Danh sách tính năng dùng dấu chấm Bullet sang trọng */}
                    <div className="space-y-3 pt-2 text-sm text-gray-200">
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Đặt phòng nhanh chóng trong vòng 30 giây</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Hệ thống ưu đãi và mã giảm giá thành viên hàng tuần</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                            <span>Đội ngũ kỹ thuật viên hỗ trợ vận hành liên tục 24/7</span>
                        </div>
                    </div>
                </div>

                {/* Footer cột trái */}
                <div className="text-xs text-gray-400/50 z-10 tracking-wide">
                    © 2026 BandHub Studio. All rights reserved.
                </div>
            </div>

            {/* CỘT PHẢI - FORM ĐĂNG KÝ ĐỒNG BỘ TỶ LỆ KÍCH THƯỚC 1:1 VỚI LOGIN */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">

                    {/* Tab Điều hướng Đăng nhập / Đăng ký */}
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

                    {/* Tiêu đề Form */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo tài khoản</h3>
                        <p className="text-xs text-gray-400 mt-1">Đăng ký thành viên để bắt đầu sử dụng dịch vụ.</p>
                    </div>

                    {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

                    {/* Form nhập liệu */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Họ và tên */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Họ và tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập họ và tên"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                        </div>

                        {/* Mật khẩu */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Tối thiểu 8 ký tự"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                        </div>

                        {/* Nút Đăng Ký */}
                        <button
                            type="submit"
                            className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]"
                        >
                            <span className="text-sm">Tạo tài khoản</span>
                        </button>
                    </form>

                    {/* Phân tách */}
                    <div className="relative my-6 text-center">
                        <hr className="border-gray-100" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider">
                            Hoặc tiếp tục với
                        </span>
                    </div>

                    {/* SSO Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600 cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                        </button>

                        {/* Nút đăng ký/tiếp tục qua Facebook */}
                        <button
                            type="button"
                            className="flex items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600 cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                        </button>
                    </div>

                    {/* Điều hướng chuyển trang về Đăng nhập */}
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