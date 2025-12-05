"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import jsPDF from "jspdf";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Order = Schema["Order"]["type"];

export default function App() {
  const { signOut, user } = useAuthenticator();
  const [orders, setOrders] = useState<Array<Order>>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      client.models.Order.observeQuery().subscribe({
        next: (data) => {
          setOrders([...data.items]);
          setLoading(false);
        },
        error: (error) => {
          console.error("Error loading orders:", error);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error setting up subscription:", error);
      setLoading(false);
    }
  }

  async function createSampleOrders() {
    const sampleOrders = [
      {
        orderNumber: "ORD-2024-001",
        distributorName: "Metro Grocery Supply",
        orderDate: "2024-12-01",
        deliveryDate: "2024-12-08",
        status: "Confirmed",
        totalAmount: 15750.50,
        items: JSON.stringify([
          { product: "Organic Apples", quantity: 200, unit: "lbs", price: 2.50 },
          { product: "Fresh Milk", quantity: 100, unit: "gallons", price: 4.25 },
          { product: "Whole Wheat Bread", quantity: 150, unit: "loaves", price: 3.50 },
        ]),
      },
      {
        orderNumber: "ORD-2024-002",
        distributorName: "Fresh Market Distributors",
        orderDate: "2024-12-02",
        deliveryDate: "2024-12-09",
        status: "Shipped",
        totalAmount: 22450.75,
        items: JSON.stringify([
          { product: "Fresh Vegetables Mix", quantity: 500, unit: "lbs", price: 3.00 },
          { product: "Orange Juice", quantity: 80, unit: "gallons", price: 6.50 },
          { product: "Greek Yogurt", quantity: 200, unit: "units", price: 1.99 },
        ]),
      },
      {
        orderNumber: "ORD-2024-003",
        distributorName: "Sunrise Foods Inc",
        orderDate: "2024-12-03",
        deliveryDate: "2024-12-10",
        status: "Pending",
        totalAmount: 8900.00,
        items: JSON.stringify([
          { product: "Premium Coffee Beans", quantity: 50, unit: "lbs", price: 12.00 },
          { product: "Organic Honey", quantity: 30, unit: "jars", price: 8.50 },
          { product: "Maple Syrup", quantity: 40, unit: "bottles", price: 15.00 },
        ]),
      },
      {
        orderNumber: "ORD-2024-004",
        distributorName: "Valley Fresh Produce",
        orderDate: "2024-12-04",
        deliveryDate: "2024-12-11",
        status: "Delivered",
        totalAmount: 31200.25,
        items: JSON.stringify([
          { product: "Fresh Strawberries", quantity: 300, unit: "lbs", price: 4.50 },
          { product: "Organic Lettuce", quantity: 250, unit: "heads", price: 2.25 },
          { product: "Cherry Tomatoes", quantity: 180, unit: "lbs", price: 3.75 },
        ]),
      },
    ];

    for (const order of sampleOrders) {
      await client.models.Order.create(order);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "Confirmed":
        return "#3b82f6";
      case "Shipped":
        return "#8b5cf6";
      case "Delivered":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const downloadOrderPDF = (order: Order) => {
    const doc = new jsPDF();
    const items = JSON.parse(order.items);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Blue color
    doc.text("Food Retailer", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Distributor Portal", 20, 28);
    
    // Order Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ${order.orderNumber}`, 20, 45);
    
    // Status Badge
    doc.setFontSize(10);
    const statusColor = getStatusColor(order.status);
    const rgb = hexToRgb(statusColor);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(150, 38, 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(order.status, 170, 43, { align: 'center' });
    
    // General Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("General Information", 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let yPos = 70;
    
    doc.text("Order Number:", 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(order.orderNumber, 70, yPos);
    
    yPos += 8;
    doc.setTextColor(100, 100, 100);
    doc.text("Distributor:", 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(order.distributorName, 70, yPos);
    
    yPos += 8;
    doc.setTextColor(100, 100, 100);
    doc.text("Order Date:", 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(order.orderDate), 70, yPos);
    
    yPos += 8;
    doc.setTextColor(100, 100, 100);
    doc.text("Delivery Date:", 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(order.deliveryDate), 70, yPos);
    
    yPos += 8;
    doc.setTextColor(100, 100, 100);
    doc.text("Total Amount:", 20, yPos);
    doc.setTextColor(16, 185, 129); // Green color
    doc.setFontSize(12);
    doc.text(formatCurrency(order.totalAmount), 70, yPos);
    
    // Order Items
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Order Items", 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(30, 64, 175);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    
    doc.text("Product", 25, yPos);
    doc.text("Qty", 100, yPos);
    doc.text("Unit", 120, yPos);
    doc.text("Price", 140, yPos);
    doc.text("Subtotal", 165, yPos);
    
    yPos += 8;
    doc.setTextColor(0, 0, 0);
    
    items.forEach((item: { product: string; quantity: number; unit: string; price: number }, idx: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(item.product, 25, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(item.unit, 120, yPos);
      doc.text(formatCurrency(item.price), 140, yPos);
      doc.text(formatCurrency(item.quantity * item.price), 165, yPos);
      
      yPos += 7;
      
      // Add line separator
      if (idx < items.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.line(20, yPos - 2, 190, yPos - 2);
      }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US")}`, 20, 285);
    
    // Save PDF
    doc.save(`Order_${order.orderNumber}.pdf`);
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <div className="header-content">
          <div className="brand">
            <div className="logo">🍎</div>
            <div>
              <h1>Food Retailer</h1>
              <p>Distributor Portal</p>
            </div>
          </div>
          <div className="user-section">
            <span className="user-email">{user?.signInDetails?.loginId}</span>
            <button onClick={signOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="portal-main">
        <div className="content-wrapper">
          <div className="page-header">
            <h2>Order Management</h2>
            <button onClick={createSampleOrders} className="action-btn">
              + Add Sample Orders
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Click "Add Sample Orders" to populate with demo data</p>
            </div>
          ) : (
            <div className="orders-layout">
              <div className="orders-list">
                <h3>Orders ({orders.length})</h3>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`order-card ${
                      selectedOrder?.id === order.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-card-header">
                      <span className="order-number">{order.orderNumber}</span>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="order-card-body">
                      <p className="distributor-name">{order.distributorName}</p>
                      <div className="order-details">
                        <span>📅 {formatDate(order.orderDate)}</span>
                        <span className="amount">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-details-panel">
                {selectedOrder ? (
                  <>
                    <div className="details-header">
                      <h3>Order Details</h3>
                      <div className="details-header-actions">
                        <button
                          onClick={() => downloadOrderPDF(selectedOrder)}
                          className="download-btn"
                          title="Download PDF"
                        >
                          📄 Download PDF
                        </button>
                        <span
                          className="status-badge large"
                          style={{
                            backgroundColor: getStatusColor(selectedOrder.status),
                          }}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    <div className="details-section">
                      <h4>General Information</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Order Number</label>
                          <span>{selectedOrder.orderNumber}</span>
                        </div>
                        <div className="info-item">
                          <label>Distributor</label>
                          <span>{selectedOrder.distributorName}</span>
                        </div>
                        <div className="info-item">
                          <label>Order Date</label>
                          <span>{formatDate(selectedOrder.orderDate)}</span>
                        </div>
                        <div className="info-item">
                          <label>Delivery Date</label>
                          <span>{formatDate(selectedOrder.deliveryDate)}</span>
                        </div>
                        <div className="info-item">
                          <label>Total Amount</label>
                          <span className="total-amount">
                            {formatCurrency(selectedOrder.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="details-section">
                      <h4>Order Items</h4>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(selectedOrder.items).map(
                            (
                              item: {
                                product: string;
                                quantity: number;
                                unit: string;
                                price: number;
                              },
                              idx: number
                            ) => (
                              <tr key={idx}>
                                <td>{item.product}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unit}</td>
                                <td>{formatCurrency(item.price)}</td>
                                <td>
                                  {formatCurrency(item.quantity * item.price)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="no-selection">
                    <div className="empty-icon">👈</div>
                    <p>Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
