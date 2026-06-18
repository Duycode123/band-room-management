import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            // Gọi API yêu cầu đặt lại mật khẩu xuống Spring Boot (Thay URL chuẩn của bạn nếu có)
            const response = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });

            if (response.status === 200) {
                setMessage('Hệ thống đã gửi liên kết đặt lại mật khẩu vào Email của bạn.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không tìm thấy tài khoản với email này.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
            {/* CỘT TRÁI - BANNER MÀU XANH LÁ ĐẬM TỐI GIẢN (KHỚP 100% VỚI LOGIN/REGISTER) */}
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

            {/* CỘT PHẢI - FORM KHÔI PHỤC MẬT KHẨU TỶ LỆ 1:1 */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">

                    {/* Nút Quay Lại Đăng Nhập Tinh Tế */}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center space-x-2 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-8 group cursor-pointer focus:outline-none"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        <span>Quay lại đăng nhập</span>
                    </button>

                    {/* Tiêu đề Form */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Quên mật khẩu?</h3>
                        <p className="text-xs text-gray-400 mt-1">Nhập email tài khoản của bạn để nhận liên kết xác thực khôi phục mật khẩu mới.</p>
                    </div>

                    {/* Thông báo thành công hoặc lỗi */}
                    {message && <div className="mb-4 text-xs text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">{message}</div>}
                    {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

                    {/* Form nhập liệu */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email nhập vào */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Địa chỉ Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                        </div>

                        {/* Nút Gửi Khôi Phục */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-orange hover:bg-brand-orangeHover disabled:bg-gray-300 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]"
                        >
                            <span className="text-sm">{isLoading ? 'Đang gửi mã...' : 'Gửi liên kết xác thực'}</span>
                        </button>
                    </form>

                    {/* Hướng dẫn bổ sung ở chân form */}
                    <div className="text-center mt-8 text-xs text-gray-400 leading-relaxed">
                        Bạn chưa nhận được email? Hãy kiểm tra lại thư mục Hộp thư rác (Spam) hoặc liên hệ đội ngũ hỗ trợ của chúng tôi.
                    </div>
                </div>
            </div>
        </div>
    );
}
