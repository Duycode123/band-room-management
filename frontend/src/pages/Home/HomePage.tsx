import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div>
            <nav
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "20px",
                    borderBottom: "1px solid #ddd",
                }}
            >
                <h2>Band Room</h2>

                <div>
                    <Link to="/login">
                        <button>Đăng nhập</button>
                    </Link>

                    <Link to="/register">
                        <button style={{ marginLeft: "10px" }}>
                            Đăng ký
                        </button>
                    </Link>
                </div>
            </nav>

            <div
                style={{
                    textAlign: "center",
                    marginTop: "80px",
                }}
            >
                <h1>Band Room Management</h1>

                <p>Đặt phòng tập nhạc trực tuyến dễ dàng</p>

                <Link to="/rooms">
                    <button>Xem phòng tập</button>
                </Link>
            </div>
        </div>
    );
}