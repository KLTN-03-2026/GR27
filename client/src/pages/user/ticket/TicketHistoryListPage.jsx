import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Button, Space, message, Pagination, Empty, Select } from 'antd';
import { EyeOutlined, DownloadOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, DesktopOutlined, AppstoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { toPng } from 'html-to-image';

import { getMyOrders } from '../../../services/orderServices';
import { getAllFilms } from '../../../services/filmServices';
import Loading from '../../../components/Loading';
import ErrorDisplay from '../../../components/ErrorDisplay';
import TicketRenderer from './TicketRenderer';
import './TicketHistoryListPage.scss';

const { Title } = Typography;

const getStatusConfig = (order) => {
    const now = dayjs();
    const startTime = dayjs(order.showtimeId?.startTime);

    if (order.orderStatus === 'confirmed') {
        if (now.isAfter(startTime)) {
            return { text: 'Đã hoàn thành', color: 'success', icon: <CheckCircleOutlined /> };
        } else {
            return { text: 'Sắp chiếu', color: 'warning', icon: <SyncOutlined spin /> };
        }
    }

    if (order.orderStatus === 'cancelled') {
        return { text: 'Đã hủy', color: 'error', icon: <CloseCircleOutlined /> };
    }
    if (order.orderStatus === 'expired') {
        return { text: 'Hết hạn', color: 'default', icon: <ClockCircleOutlined /> };
    }
    return { text: order.orderStatus, color: 'default' };
};

const TicketHistoryListPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [films, setFilms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    
    const [filters, setFilters] = useState({
        status: 'confirmed', // Mặc định hiển thị vé đã mua
        filmId: 'all',
    });

    const [ticketToExport, setTicketToExport] = useState(null);
    const ticketRef = useRef(null);

    // Fetch data từ backend với đầy đủ filters
    const fetchData = useCallback(async (page, currentFilters) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page,
                limit: pagination.pageSize,
                orderStatus: currentFilters.status,
                // Gửi filmId lên backend để lọc
                ...(currentFilters.filmId !== 'all' && { filmId: currentFilters.filmId })
            };
            
            const [ordersRes, filmsRes] = await Promise.all([
                getMyOrders(params),
                films.length === 0 ? getAllFilms() : Promise.resolve({ data: films })
            ]);

            setOrders(ordersRes.data);
            setPagination(prev => ({
                ...prev,
                current: ordersRes.pagination.page,
                total: ordersRes.pagination.total,
            }));

            if (films.length === 0) setFilms(filmsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải lịch sử đặt vé.');
            message.error('Lỗi khi tải lịch sử vé.');
        } finally {
            setLoading(false);
        }
    }, [pagination.pageSize, films]);

    // Fetch khi filter thay đổi (reset về trang 1)
    useEffect(() => {
        fetchData(1, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.filmId]);

    // Xử lý chuyển trang
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current: page }));
        fetchData(page, filters);
    };

    // Xử lý thay đổi filter
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };
    
    // Xử lý xuất vé
    const handleExportTicket = (order) => {
        setTicketToExport(order);
    };

    // Effect để xuất ảnh vé
    useEffect(() => {
        if (!ticketToExport || !ticketRef.current) return;

        const timer = setTimeout(() => {
            const key = 'downloading';
            message.loading({ content: 'Đang chuẩn bị ảnh vé...', key });

            toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = `movix-ticket-${ticketToExport.ticketCode}.png`;
                    link.href = dataUrl;
                    link.click();
                    message.success({ content: 'Đã tải vé về máy!', key, duration: 2 });
                })
                .catch((err) => {
                    console.error("Lỗi xuất ảnh vé:", err);
                    message.error({ content: 'Không thể xuất vé, vui lòng thử lại.', key, duration: 3 });
                })
                .finally(() => {
                    setTicketToExport(null);
                });
        }, 100);

        return () => clearTimeout(timer);
    }, [ticketToExport]);
    
    // Render ticket card
    const renderTicketCard = (order) => {
        const { showtimeId, seats, comboFoods, totalAmount, ticketCode } = order;
        const { filmId, cinemaId, roomId } = showtimeId || {};
        const statusConfig = getStatusConfig(order);
        const isDisabled = order.orderStatus !== 'confirmed';

        return (
            <Card key={order._id} className="ticket-card" bodyStyle={{ padding: 0 }}>
                <div className="ticket-header">
                    <Space>
                        <Tag className="ticket-id">#{ticketCode}</Tag>
                        <Tag color={statusConfig.color} icon={statusConfig.icon}>
                            {statusConfig.text}
                        </Tag>
                    </Space>
                    <span className="order-date">Đặt lúc: {dayjs(order.createdAt).format('HH:mm DD/MM/YYYY')}</span>
                </div>
                <div className="ticket-body">
                    <Row gutter={[24, 16]} align="middle">
                        <Col flex="1">
                            <div className="film-info-row">
                                <img src={filmId?.thumbnail} alt={filmId?.title} className="film-thumbnail" />
                                <div className="film-details">
                                    <Title level={5} className="film-title">{filmId?.title}</Title>
                                    <div className="info-item"><EnvironmentOutlined /> {cinemaId?.name}</div>
                                    <div className="info-item"><AppstoreOutlined /> Ghế: {seats.map(s => s.seatKey).join(', ')}</div>
                                    <div className="info-item"><DesktopOutlined /> Phòng: {roomId?.name} - {showtimeId?.format}</div>
                                    <div className="info-item"><ClockCircleOutlined /> {dayjs(showtimeId?.startTime).format('HH:mm - DD/MM/YYYY')}</div>
                                </div>
                            </div>
                            {comboFoods.length > 0 && (
                                <div className="combo-info">
                                    <strong>Combo:</strong> {comboFoods.map(c => `${c.name} (x${c.quantity})`).join('; ')}
                                </div>
                            )}
                        </Col>
                        <Col>
                            <div className="action-panel">
                                <div className="total-amount">
                                    <div className="amount">{totalAmount.toLocaleString('vi-VN')}đ</div>
                                    <div className="status-text">{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
                                </div>
                                <Space direction="vertical" className="action-buttons">
                                    <Button 
                                        type="primary" 
                                        icon={<EyeOutlined />} 
                                        onClick={() => navigate(`/ticket/${order._id}`)} 
                                        block 
                                        disabled={isDisabled}
                                    >
                                        Xem chi tiết
                                    </Button>
                                    <Button 
                                        icon={<DownloadOutlined />} 
                                        onClick={() => handleExportTicket(order)} 
                                        block 
                                        disabled={isDisabled}
                                    >
                                        Xuất vé
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Card>
        );
    };

    return (
        <div className="ticket-history-page">
            <header className="page-header">
                <Title level={2}>Lịch sử đặt vé</Title>
            </header>

            <Card className="filters-card">
                <Row gutter={[16, 16]}>
                    <Col>
                        <Space>
                            <span>Phim:</span>
                            <Select 
                                value={filters.filmId} 
                                style={{ width: 250 }} 
                                onChange={(value) => handleFilterChange('filmId', value)} 
                                showSearch
                                filterOption={(input, option) => 
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={[
                                    { value: 'all', label: 'Tất cả phim' }, 
                                    ...films.map(film => ({ value: film._id, label: film.title }))
                                ]}
                            />
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <span>Trạng thái:</span>
                            <Select 
                                value={filters.status} 
                                style={{ width: 180 }} 
                                onChange={(value) => handleFilterChange('status', value)}
                                options={[
                                    { value: 'all', label: 'Tất cả' },
                                    { value: 'confirmed', label: 'Vé đã mua' },
                                    { value: 'cancelled', label: 'Đã hủy' },
                                    { value: 'expired', label: 'Hết hạn' },
                                ]}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            {loading ? (
                <Loading tip="Đang tải lịch sử vé..." />
            ) : error ? (
                <ErrorDisplay message={error} />
            ) : (
                <>
                    {orders.length > 0 ? (
                        <div className="ticket-list-container">
                            {orders.map(order => renderTicketCard(order))}
                        </div>
                    ) : (
                        <Empty description="Không có đơn hàng nào phù hợp." />
                    )}

                    {pagination.total > pagination.pageSize && (
                        <div className="pagination-container">
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} vé`}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Hidden ticket renderer for export */}
            <div className="hidden-ticket-renderer">
                <TicketRenderer ref={ticketRef} ticket={ticketToExport} />
            </div>
        </div>
    );
};

export default TicketHistoryListPage;