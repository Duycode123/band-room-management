import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Lấy chuỗi mã token ngẫu nhiên từ thanh URL của trình duyệt
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không trùng khớp.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Gọi API cập nhật mật khẩu mới ở Backend (Chúng ta sẽ viết API này ở bước sau)
            const response = await axios.post('http://localhost:8080/api/auth/reset-password', {
                token,
                newPassword: password
            });

            if (response.status === 200) {
                alert('Đổi mật khẩu thành công! Hệ thống sẽ chuyển bạn về trang Đăng nhập.');
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Liên kết đã hết hạn hoặc không hợp lệ, vui lòng yêu cầu lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
            {/* CỘT TRÁI - BANNER MÀU XANH LÁ ĐẬM TỐI GIẢN (ĐỒNG BỘ 100%) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16 relative overflow-hidden">
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

                <div className="max-w-xl my-auto z-10 space-y-6">
                    <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Đặt phòng tập <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Hơn 6 phòng tập chuyên nghiệp, đầy đủ trang thiết bị nhạc cụ hiện đại cùng hệ thống cách âm tiêu chuẩn quốc tế.
                    </p>

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

                <div className="text-xs text-gray-400/50 z-10 tracking-wide">
                    © 2026 BandHub Studio. All rights reserved.
                </div>
            </div>

            {/* CỘT PHẢI - FORM ĐỔI MẬT KHẨU TỶ LỆ KHỚP 1:1 */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">

                    {/* Tiêu đề Form */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Mật khẩu mới</h3>
                        <p className="text-xs text-gray-400 mt-1">Thiết lập mật khẩu bảo mật mới để khôi phục quyền truy cập tài khoản.</p>
                    </div>

                    {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

                    {/* Form nhập liệu */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Trường Mật khẩu mới */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Tối thiểu 8 ký tự"
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />

                                {/* Con mắt ẩn hiện mật khẩu dùng chung cho cả 2 ô */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Trường Xác nhận mật khẩu mới */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
                                />
                            </div>
                        </div>

                        {/* Nút Đổi Mật Khẩu */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-orange hover:bg-brand-orangeHover disabled:bg-gray-300 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]"
                        >
                            <span className="text-sm">{isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                        </button>
                    </form>

                    {/* Điều hướng quay lại đăng nhập */}
                    <div className="text-center mt-8 text-xs text-gray-500">
                        Nhớ ra mật khẩu?{' '}
                        <button onClick={() => navigate('/login')} className="text-brand-orange font-semibold hover:underline cursor-pointer">
                            Đăng nhập ngay
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
