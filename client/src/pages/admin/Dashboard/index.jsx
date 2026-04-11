import React, { useState, useEffect, useCallback } from 'react';
import { DatePicker, Select, Space, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import {
  getOverviewStats,
  getRevenueChart,
  getTopFilms,
  getRevenueByCinema,
  getUserGrowth,
  getSeatTypeStats,
  getFormatStats,
} from '../../../services/dashboardServices';
import {
  OverviewCards,
  RevenueChart,
  TopFilmsTable,
  SeatTypeChart,
  FormatChart,
  CinemaRevenueTable,
  UserGrowthChart,
  QuickStatsCard,
  RevenueComparisonCard,
} from '../../../components/Dashboard';
import Loading from '../../../components/Loading';
import ErrorDisplay from '../../../components/ErrorDisplay';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  
  // Filter states
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState('day');
  const [topFilmType, setTopFilmType] = useState('revenue');

  // Data states
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topFilms, setTopFilms] = useState([]);
  const [cinemaRevenue, setCinemaRevenue] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [seatTypeData, setSeatTypeData] = useState([]);
  const [formatData, setFormatData] = useState([]);

  // Loading states
  const [loading, setLoading] = useState({
    overview: true,
    revenue: true,
    topFilms: true,
    cinema: true,
    userGrowth: true,
    seatType: true,
    format: true,
  });

  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Build query params
  const getQueryParams = useCallback(() => {
    const params = {};
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }
    return params;
  }, [dateRange]);

  // Fetch Overview Stats
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true }));
      const params = getQueryParams();
      const result = await getOverviewStats(params);
      
      if (result.code === 200) {
        setOverview(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      messageApi.error(err.message || 'Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  }, [getQueryParams, messageApi]);

  // Fetch Revenue Chart
  const fetchRevenueChart = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, revenue: true }));
      const params = { ...getQueryParams(), period };
      const result = await getRevenueChart(params);
      
      if (result.code === 200) {
        setRevenueData(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching revenue chart:', err);
      messageApi.error(err.message || 'Không thể tải biểu đồ doanh thu');
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  }, [getQueryParams, period, messageApi]);

  // Fetch Top Films
  const fetchTopFilms = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, topFilms: true }));
      const params = { 
        ...getQueryParams(), 
        type: topFilmType,
        limit: 5 
      };
      const result = await getTopFilms(params);
      
      if (result.code === 200) {
        setTopFilms(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching top films:', err);
      messageApi.error(err.message || 'Không thể tải top phim');
    } finally {
      setLoading(prev => ({ ...prev, topFilms: false }));
    }
  }, [getQueryParams, topFilmType, messageApi]);

  // Fetch Cinema Revenue
  const fetchCinemaRevenue = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, cinema: true }));
      const params = { ...getQueryParams(), limit: 10 };
      const result = await getRevenueByCinema(params);
      
      if (result.code === 200) {
        setCinemaRevenue(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching cinema revenue:', err);
      messageApi.error(err.message || 'Không thể tải doanh thu theo rạp');
    } finally {
      setLoading(prev => ({ ...prev, cinema: false }));
    }
  }, [getQueryParams, messageApi]);

  // Fetch User Growth
  const fetchUserGrowth = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, userGrowth: true }));
      const params = { ...getQueryParams(), period };
      const result = await getUserGrowth(params);
      
      if (result.code === 200) {
        setUserGrowth(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching user growth:', err);
      messageApi.error(err.message || 'Không thể tải tăng trưởng người dùng');
    } finally {
      setLoading(prev => ({ ...prev, userGrowth: false }));
    }
  }, [getQueryParams, period, messageApi]);

  // Fetch Seat Type Stats
  const fetchSeatTypeStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, seatType: true }));
      const params = getQueryParams();
      const result = await getSeatTypeStats(params);
      
      if (result.code === 200) {
        setSeatTypeData(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching seat type stats:', err);
      messageApi.error(err.message || 'Không thể tải thống kê loại ghế');
    } finally {
      setLoading(prev => ({ ...prev, seatType: false }));
    }
  }, [getQueryParams, messageApi]);

  // Fetch Format Stats
  const fetchFormatStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, format: true }));
      const params = getQueryParams();
      const result = await getFormatStats(params);
      
      if (result.code === 200) {
        setFormatData(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching format stats:', err);
      messageApi.error(err.message || 'Không thể tải thống kê định dạng');
    } finally {
      setLoading(prev => ({ ...prev, format: false }));
    }
  }, [getQueryParams, messageApi]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([
        fetchOverview(),
        fetchRevenueChart(),
        fetchTopFilms(),
        fetchCinemaRevenue(),
        fetchUserGrowth(),
        fetchSeatTypeStats(),
        fetchFormatStats(),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setInitialLoading(false);
    }
  }, [
    fetchOverview,
    fetchRevenueChart,
    fetchTopFilms,
    fetchCinemaRevenue,
    fetchUserGrowth,
    fetchSeatTypeStats,
    fetchFormatStats,
  ]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Handle period change
  const handlePeriodChange = (value) => {
    setPeriod(value);
  };

  // Handle top film type change
  const handleTopFilmTypeChange = (value) => {
    setTopFilmType(value);
  };

  // Handle retry
  const handleRetry = () => {
    setInitialLoading(true);
    fetchAllData();
  };

  // Show initial loading
  if (initialLoading) {
    return <Loading tip="Đang tải dashboard..." />;
  }

  // Show error
  if (error) {
    return <ErrorDisplay message={error} onRetry={handleRetry} />;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>
            Dashboard
          </h1>
          <Space size="middle" wrap>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: 280 }}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Select
              value={period}
              onChange={handlePeriodChange}
              style={{ width: 130 }}
            >
              <Option value="day">Theo ngày</Option>
              <Option value="week">Theo tuần</Option>
              <Option value="month">Theo tháng</Option>
            </Select>
            <Select
              value={topFilmType}
              onChange={handleTopFilmTypeChange}
              style={{ width: 180 }}
            >
              <Option value="revenue">Top doanh thu</Option>
              <Option value="rating">Top đánh giá</Option>
              <Option value="bookings">Top đặt vé</Option>
            </Select>
          </Space>
        </div>

        {/* Overview Cards */}
        <OverviewCards data={overview} loading={loading.overview} />

        {/* Revenue Chart - Full Width */}
        <div style={{ marginTop: 24 }}>
          <RevenueChart data={revenueData} loading={loading.revenue} />
        </div>

        {/* Row 1: Top Films & Quick Stats */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <TopFilmsTable
              data={topFilms}
              loading={loading.topFilms}
              type={topFilmType}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <QuickStatsCard overview={overview} loading={loading.overview} />
              <RevenueComparisonCard
                revenueData={revenueData}
                loading={loading.revenue}
              />
            </Space>
          </Col>
        </Row>

        {/* Row 2: Charts */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}>
            <UserGrowthChart
              data={userGrowth}
              loading={loading.userGrowth}
            />
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={16}>
              <Col span={24}>
                <SeatTypeChart data={seatTypeData} loading={loading.seatType} />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Row 3: Format Chart & Cinema Revenue */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}>
            <FormatChart data={formatData} loading={loading.format} />
          </Col>
          <Col xs={24} md={12}>
            <CinemaRevenueTable
              data={cinemaRevenue}
              loading={loading.cinema}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default DashboardPage;