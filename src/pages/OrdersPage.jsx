import { useState, useMemo, useEffect, useRef } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCards } from "@/components/admin/KpiCards";
import {
  DELIVERY_STATUS_OPTIONS,
  FULFILLMENT_STATUS_OPTIONS,
} from "@/data/mockAdmin";
import { Download, Plus, AlertCircle, X, Printer, Check } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("All schools");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailOrder, setDetailOrder] = useState(null);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState(["All schools"]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [savedTrackingIds, setSavedTrackingIds] = useState({});
  const iframeRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        let token;
        try {
          if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem("uniformlab_admin_auth");
            token = raw ? JSON.parse(raw).token : null;
          }
        } catch {
          token = null;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [ordersRes, partnersRes, schoolsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/orders`, { headers }),
          fetch(`${API_BASE}/api/admin/delivery-partners`, { headers }),
          fetch(`${API_BASE}/api/admin/schools`, { headers }),
        ]);

        const ordersJson = await ordersRes.json().catch(() => []);
        const partnersJson = await partnersRes.json().catch(() => []);
        const schoolsJson = await schoolsRes.json().catch(() => []);

        if (!ordersRes.ok) {
          throw new Error(
            ordersJson?.error?.message || "Failed to load orders",
          );
        }
        if (!partnersRes.ok) {
          throw new Error(
            partnersJson?.error?.message || "Failed to load delivery partners",
          );
        }
        if (!schoolsRes.ok) {
          throw new Error(
            schoolsJson?.error?.message || "Failed to load schools",
          );
        }

        const mapped = (ordersJson || []).map((o) => {
          const lineItems = Array.isArray(o.items)
            ? o.items.map((i) => ({
                name: i.productName,
                qty: i.quantity,
                size: i.size,
                color: i.color || "",
                price: `₹${i.price}`,
              }))
            : [];

          const count = Array.isArray(o.items) ? o.items.length : 0;
          const schoolName = o.school && o.school.name ? o.school.name : "—";

          return {
            id: o.uniqueOrderId,
            orderMongoId: o._id,
            date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
            customer: o.customerName,
            customerPhone: o.customerPhone,
            school: schoolName,
            schoolName,
            total: `₹${o.totalAmount}`,
            payment: o.paymentStatus === "Paid" ? "Paid" : "Payment pending",
            fulfillment: o.fulfillmentStatus,
            delivery: o.deliveryStatus,
            deliveryReason: o.deliveryReason,
            method: o.deliveryMethod,
            tags: [o.paymentMethod || "Online"],
            hasWarning: o.deliveryStatus === "Undelivered",
            assignedDeliveryPartnerId: o.assignedDeliveryPartner?._id || null,
            trackingNumber: o.trackingNumber || "",
            items: `${count} item${count === 1 ? "" : "s"}`,
            lineItems,
            address: o.address,
            gatewayPaymentId: o.gatewayPaymentId,
            gatewayPaymentRequestId: o.gatewayPaymentRequestId,
          };
        });

        setOrders(mapped);
        setDeliveryPartners(partnersJson || []);

        const realSchools = Array.isArray(schoolsJson)
          ? schoolsJson
              .filter((s) => !!s.name)
              .map((s) => s.name)
              .sort((a, b) => a.localeCompare(b))
          : [];
        setSchoolOptions(["All schools", ...realSchools]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    let list = orders.filter(
      (o) =>
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()),
    );
    if (schoolFilter !== "All schools") {
      list = list.filter((o) => o.school === schoolFilter);
    }
    return list;
  }, [orders, search, schoolFilter]);

  const updateOrder = (orderId, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    );
  };

  const getAdminHeaders = () => {
    try {
      if (typeof window === "undefined") return {};
      const raw = window.localStorage.getItem("uniformlab_admin_auth");
      const token = raw ? JSON.parse(raw).token : null;
      return token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };
    } catch {
      return { "Content-Type": "application/json" };
    }
  };

  const persistOrderPatch = async (orderMongoId, body) => {
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderMongoId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-console
        console.error("Failed to update order", data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error updating order", err);
    }
  };

  const handleFulfillmentChange = (orderId, value) => {
    const order = orders.find((o) => o.id === orderId);
    updateOrder(orderId, { fulfillment: value });
    if (order?.orderMongoId) {
      persistOrderPatch(order.orderMongoId, { fulfillmentStatus: value });
    }
  };

  const handleDeliveryChange = (orderId, value) => {
    const existing = orders.find((o) => o.id === orderId);
    const nextReason =
      value === "Undelivered" ? existing?.deliveryReason || "" : "";
    updateOrder(orderId, {
      delivery: value,
      deliveryReason: nextReason,
    });
    if (existing?.orderMongoId) {
      persistOrderPatch(existing.orderMongoId, {
        deliveryStatus: value,
        deliveryReason: nextReason,
      });
    }
  };

  const setDeliveryReason = (orderId, reason) => {
    setUndeliveredReason((r) => ({ ...r, [orderId]: reason }));
    updateOrder(orderId, { deliveryReason: reason });
    const order = orders.find((o) => o.id === orderId);
    if (order?.orderMongoId) {
      persistOrderPatch(order.orderMongoId, {
        deliveryStatus: order.delivery,
        deliveryReason: reason,
      });
    }
  };

  const handleAssignDelivery = (orderId, partnerId) => {
    updateOrder(orderId, { assignedDeliveryPartnerId: partnerId });
    const order = orders.find((o) => o.id === orderId);
    if (order?.orderMongoId) {
      persistOrderPatch(order.orderMongoId, {
        assignedDeliveryPartnerId: partnerId,
      });
    }
  };

  const handleSaveTracking = (orderId) => {
    const val = (
      trackingInputs[orderId] ??
      orders.find((o) => o.id === orderId)?.trackingNumber ??
      ""
    ).trim();
    updateOrder(orderId, { trackingNumber: val });
    const order = orders.find((o) => o.id === orderId);
    if (order?.orderMongoId) {
      persistOrderPatch(order.orderMongoId, { trackingNumber: val });
    }
    setSavedTrackingIds((prev) => ({ ...prev, [orderId]: true }));
    setTimeout(
      () =>
        setSavedTrackingIds((prev) => {
          const n = { ...prev };
          delete n[orderId];
          return n;
        }),
      2000,
    );
  };

  const buildInvoiceHtml = (order) => {
    const addr = order.address;
    const itemCount = (order.lineItems || []).length;

    const lineItemsHtml = (order.lineItems || [])
      .map(
        (i, idx) => `
        <tr>
          <td style="color:#999;">${idx + 1}</td>
          <td><strong>${i.name}</strong></td>          <td style="text-align:center;">${i.color || "—"}</td>          <td style="text-align:center;">${i.size || "—"}</td>
          <td style="text-align:center;">${i.qty}</td>
          <td style="text-align:right;">${i.price}</td>
          <td style="text-align:right; font-weight:600;">${i.price}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice – ${order.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;background:#fff;color:#1a1a1a;font-size:13px;line-height:1.55;padding:36px 44px;max-width:820px;margin:0 auto;}

    /* ── Header ── */
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #111;margin-bottom:26px;}
    .brand-name{font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#111;text-transform:uppercase;}
    .brand-sub{font-size:10.5px;color:#777;letter-spacing:1.4px;text-transform:uppercase;margin-top:3px;}
    .invoice-label{font-size:30px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#111;text-align:right;}
    .meta-table{margin-top:8px;margin-left:auto;border-collapse:collapse;}
    .meta-table td{padding:2px 0 2px 14px;font-size:12px;}
    .meta-table td:first-child{color:#888;font-weight:700;text-align:right;padding-left:0;padding-right:8px;}
    .meta-table td:last-child{font-weight:600;color:#222;}

    /* ── Status badge ── */
    .badge{display:inline-block;padding:2px 9px;border-radius:3px;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;}
    .badge-paid{background:#d1fae5;color:#065f46;}
    .badge-pending{background:#fef3c7;color:#92400e;}

    /* ── Address grid ── */
    .address-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:18px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;margin-bottom:24px;}
    .address-block h3{font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin-bottom:8px;}
    .address-block .aname{font-size:14px;font-weight:700;color:#111;margin-bottom:3px;}
    .address-block p{font-size:12.5px;color:#444;margin-bottom:2px;}
    .address-block .pin{font-weight:700;color:#111;font-size:13px;}

    /* ── Items table ── */
    .items-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    .items-table thead tr{background:#111;color:#fff;}
    .items-table thead th{padding:10px 12px;font-size:10px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;text-align:left;}
    .items-table thead th.r{text-align:right;}
    .items-table thead th.c{text-align:center;}
    .items-table tbody tr{border-bottom:1px solid #f0f0f0;}
    .items-table tbody tr:nth-child(even){background:#fafafa;}
    .items-table tbody td{padding:10px 12px;font-size:13px;color:#333;vertical-align:middle;}
    .items-table tfoot tr{background:#f4f4f4;border-top:2px solid #ddd;}
    .items-table tfoot td{padding:10px 12px;font-size:13px;font-weight:700;color:#111;}

    /* ── Totals ── */
    .totals-wrapper{display:flex;justify-content:flex-end;margin-bottom:24px;}
    .totals-box{width:260px;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;}
    .totals-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;border-bottom:1px solid #f0f0f0;color:#555;}
    .totals-row:last-child{border-bottom:none;background:#111;color:#fff;font-size:15px;font-weight:800;padding:11px 14px;}

    /* ── Info cards ── */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;}
    .info-card{background:#f9fafb;border-radius:6px;padding:14px 16px;border-left:3px solid #111;}
    .info-card h3{font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin-bottom:8px;}
    .info-card p{font-size:12px;color:#444;margin-bottom:3px;}
    .info-card .ref{font-family:'Courier New',monospace;font-size:10.5px;color:#666;word-break:break-all;margin-top:4px;background:#eee;padding:4px 6px;border-radius:3px;}

    /* ── Footer ── */
    .footer{margin-top:28px;padding-top:14px;border-top:2px solid #111;display:flex;justify-content:space-between;align-items:center;}
    .footer-left{font-size:12px;color:#666;}
    .footer-brand{font-weight:800;color:#111;font-size:13px;}
    .footer-right{text-align:right;font-size:11px;color:#999;}
    .footer-orderid{font-family:'Courier New',monospace;font-size:12px;color:#555;margin-top:3px;letter-spacing:0.5px;}

    @media print{
      body{padding:14px 18px;}
      @page{margin:8mm 10mm;size:A4;}
    }
  </style>
</head>
<body>

  <!-- ═══ HEADER ═══ -->
  <div class="header">
    <div>
      <div class="brand-name">Uniform Lab</div>
      <div class="brand-sub">School Uniforms &amp; Accessories</div>
    </div>
    <div>
      <div class="invoice-label">Invoice</div>
      <table class="meta-table">
        <tr><td>Invoice No.</td><td>${order.id}</td></tr>
        <tr><td>Date</td><td>${order.date}</td></tr>
        <tr><td>School</td><td>${order.schoolName || order.school || "—"}</td></tr>
        <tr><td>Status</td><td><span class="badge ${order.payment === "Paid" ? "badge-paid" : "badge-pending"}">${order.payment}</span></td></tr>
      </table>
    </div>
  </div>

  <!-- ═══ ADDRESSES ═══ -->
  <div class="address-grid">
    <div class="address-block">
      <h3>Billed To / Customer</h3>
      <p class="aname">${order.customer || "—"}</p>
      ${order.customerPhone ? `<p>&#128222; ${order.customerPhone}</p>` : ""}
      <p style="margin-top:4px;font-size:12px;color:#888;">School: ${order.schoolName || order.school || "—"}</p>
    </div>
    <div class="address-block">
      <h3>Shipped To / Delivery Address</h3>
      ${
        addr
          ? `<p class="aname">${addr.name}</p>
           <p>${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}</p>
           <p>${addr.city}, ${addr.state}</p>
           <p class="pin">PIN: ${addr.pincode}</p>`
          : '<p style="color:#bbb;font-style:italic;">No delivery address on record</p>'
      }
    </div>
  </div>

  <!-- ═══ LINE ITEMS ═══ -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:32px;">#</th>
        <th>Product / Description</th>
        <th class="c" style="width:80px;">Colour</th>
        <th class="c" style="width:64px;">Size</th>
        <th class="c" style="width:52px;">Qty</th>
        <th class="r" style="width:96px;">Unit Price</th>
        <th class="r" style="width:96px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="color:#888;font-weight:400;font-size:12px;">${itemCount} item${itemCount === 1 ? "" : "s"} total</td>
        <td></td>
        <td style="text-align:right;font-size:12px;font-weight:600;color:#555;">Total</td>
        <td style="text-align:right;">${order.total}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ═══ TOTALS ═══ -->
  <div class="totals-wrapper">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${order.total}</span></div>
      <div class="totals-row"><span>Delivery charges</span><span style="font-weight:700;">&#8377;125</span></div>
      <div class="totals-row"><span>Total (INR)</span><span>${order.total}</span></div>
    </div>
  </div>

  <!-- ═══ ORDER INFO CARDS ═══ -->
  <div class="info-grid">
    <div class="info-card">
      <h3>Payment Details</h3>
      <p><strong>Method:</strong> ${(order.tags && order.tags[0]) || "Online"}</p>
      <p><strong>Status:</strong> ${order.payment}</p>
      ${
        order.gatewayPaymentId
          ? `<p style="margin-top:5px;font-size:11px;color:#888;">Transaction Reference:</p>
           <div class="ref">${order.gatewayPaymentId}</div>`
          : ""
      }
    </div>
    <div class="info-card">
      <h3>Fulfilment &amp; Delivery</h3>
      <p><strong>Fulfilment:</strong> ${order.fulfillment || "—"}</p>
      <p><strong>Delivery:</strong> ${order.delivery || "—"}${order.deliveryReason ? " &mdash; " + order.deliveryReason : ""}</p>
      <p><strong>Method:</strong> ${order.method || "—"}</p>
    </div>
  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="footer">
    <div class="footer-left">
      <span class="footer-brand">THE UNIFORM LAB</span> &nbsp;&mdash;&nbsp; Thank you for your order!<br/>
      <span style="font-size:11px;">Shop 23/24 , Anusuya Enclave, Jagtap Chowk, Wanowrie, Pune – 411040 &nbsp;|&nbsp; &#128222; 9028552855 &nbsp;|&nbsp; help@theuniformlab.in</span>
    </div>
    <div class="footer-right">
      <div>Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
      <div class="footer-orderid">${order.id}</div>
    </div>
  </div>

</body>
</html>`;
    return html;
  };

  const printStickers = () => {
    const selected = orders.filter((o) => selectedIds.includes(o.id));
    if (!selected.length) return;

    const stickerHtml = selected
      .map((o) => {
        const addr = o.address;
        const items = (o.lineItems || [])
          .map(
            (i) =>
              `${i.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` · ${i.color}` : ""} × ${i.qty}`,
          )
          .join("<br/>");
        return `
<div class="sticker">
  <div class="sticker-head">
    <span class="brand">UNIFORM LAB</span>
    <span class="oid">${o.id}</span>
  </div>
  <div class="sticker-body">
    <div class="row"><span class="lbl">To</span><span class="val name">${addr?.name || o.customer || "—"}</span></div>
    ${addr ? `<div class="addr">${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} – ${addr.pincode}</div>` : ""}
    <div class="row"><span class="lbl">Phone</span><span class="val">${o.customerPhone || "—"}</span></div>
    <div class="row items-row"><span class="lbl">Items</span><span class="val items">${items || "—"}</span></div>
    ${o.trackingNumber ? `<div class="row track-row"><span class="lbl">Tracking</span><span class="val track">${o.trackingNumber}</span></div>` : ""}
  </div>
  <div class="sticker-foot">
    <span>${o.date ? o.date.split(",")[0] : ""}</span>
    <span>${o.total}</span>
  </div>
</div>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Shipping Stickers</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;}
  .page{width:210mm;margin:0 auto;padding:8mm;display:grid;grid-template-columns:1fr 1fr;gap:5mm;}
  .sticker{
    border:1.2px solid #222;
    border-radius:4px;
    overflow:hidden;
    page-break-inside:avoid;
    break-inside:avoid;
    display:flex;
    flex-direction:column;
  }
  .sticker-head{
    background:#111;
    color:#fff;
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:3.5px 8px;
    font-size:8px;
    font-weight:800;
    letter-spacing:.8px;
    text-transform:uppercase;
  }
  .oid{font-size:7.5px;letter-spacing:.4px;opacity:.85;font-family:monospace;}
  .sticker-body{
    padding:6px 8px;
    flex:1;
    display:flex;
    flex-direction:column;
    gap:3px;
  }
  .row{display:flex;gap:6px;align-items:baseline;}
  .lbl{font-size:6.5px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#888;min-width:38px;flex-shrink:0;}
  .val{font-size:8.5px;color:#111;line-height:1.3;}
  .name{font-size:10px;font-weight:800;color:#000;}
  .addr{font-size:7.5px;color:#444;line-height:1.4;margin-left:44px;margin-top:-1px;}
  .items{font-size:7.5px;line-height:1.45;}
  .track{font-family:monospace;font-size:8px;font-weight:700;color:#0050b3;letter-spacing:.3px;}
  .items-row,.track-row{align-items:flex-start;}
  .sticker-foot{
    border-top:1px dashed #ccc;
    display:flex;
    justify-content:space-between;
    padding:3px 8px;
    font-size:7px;
    color:#888;
    font-weight:600;
  }
  @page{size:A4;margin:0;}
  @media print{
    body{background:#fff;}
    .page{padding:5mm;}
  }
</style>
</head>
<body><div class="page">${stickerHtml}</div></body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    }
  };

  const printReceipt = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        actions={
          <>
            <button
              type="button"
              onClick={printStickers}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                selectedIds.length
                  ? `Print stickers for ${selectedIds.length} selected order${selectedIds.length > 1 ? "s" : ""}`
                  : "Select orders to print stickers"
              }
            >
              <Download size={16} />
              {selectedIds.length > 0
                ? `Print Stickers (${selectedIds.length})`
                : "Print Stickers"}
            </button>
            <Link
              to="/orders/create"
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
              <Plus size={16} /> Create order
            </Link>
          </>
        }
      />
      <KpiCards
        items={[
          { label: "Orders total", value: String(orders.length || 0) },
          {
            label: "Items ordered",
            value: String(
              orders.reduce(
                (sum, o) => sum + (o.lineItems ? o.lineItems.length : 0),
                0,
              ),
            ),
          },
          {
            label: "Orders fulfilled",
            value: String(
              orders.filter((o) => o.fulfillment === "Fulfilled").length,
            ),
          },
        ]}
      />

      <div className="px-3 md:px-6 pb-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            School
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            >
              {schoolOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="search"
              placeholder="Search by order ID or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-10 px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? filtered.map((r) => r.id) : [],
                        )
                      }
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Order
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    School
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Payment
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Fulfillment
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Delivery
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Items
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Method
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Tags
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Payment ref
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                    Tracking No.
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setDetailOrder(row)}
                  >
                    <td
                      className="w-10 px-3 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedIds((s) => [...s, row.id]);
                          else
                            setSelectedIds((s) =>
                              s.filter((id) => id !== row.id),
                            );
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        {row.hasWarning && (
                          <AlertCircle
                            size={14}
                            className="text-amber-500 shrink-0"
                          />
                        )}
                        {row.id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.customer}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {row.school || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                      {row.total}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${row.payment === "Paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {row.payment}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2.5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={row.fulfillment}
                        onChange={(e) =>
                          handleFulfillmentChange(row.id, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white min-w-[100px]"
                      >
                        {FULFILLMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className="px-3 py-2.5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={row.delivery}
                        onChange={(e) =>
                          handleDeliveryChange(row.id, e.target.value)
                        }
                        className={`text-xs border rounded px-2 py-1 bg-white min-w-[120px] ${
                          row.delivery === "Delivered"
                            ? "border-green-200 text-green-800"
                            : row.delivery === "Undelivered"
                              ? "border-red-200 text-red-800"
                              : "border-gray-200"
                        }`}
                      >
                        {DELIVERY_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {row.items}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {row.method || "₹125 delivery"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(row.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs max-w-[140px] truncate">
                      {row.gatewayPaymentId || "—"}
                    </td>
                    <td
                      className="px-3 py-2.5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={
                            trackingInputs[row.id] ?? row.trackingNumber ?? ""
                          }
                          onChange={(e) =>
                            setTrackingInputs((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveTracking(row.id)
                          }
                          placeholder="Tracking no."
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white w-[130px] focus:outline-none focus:border-green-400"
                        />
                        <button
                          onClick={() => handleSaveTracking(row.id)}
                          className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${
                            savedTrackingIds[row.id]
                              ? "bg-green-600 border-green-700 text-white"
                              : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          }`}
                          title="Save tracking number"
                        >
                          <Check size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span className="whitespace-nowrap">
            {filtered.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Order detail popup */}
      {detailOrder &&
        (() => {
          const order =
            orders.find((o) => o.id === detailOrder.id) || detailOrder;
          return (
            <div
              className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 md:p-4"
              onClick={() => setDetailOrder(null)}
            >
              <div
                className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:max-w-5xl flex flex-col"
                style={{ maxHeight: "95dvh" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Invoice
                    </span>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                      {order.id}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={printReceipt}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Printer size={15} /> Print
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailOrder(null)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* ── Compact management strip ── */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-sm shrink-0">
                  <label className="flex items-center gap-1.5 text-gray-600 font-medium">
                    Fulfilment
                    <select
                      value={order.fulfillment}
                      onChange={(e) =>
                        handleFulfillmentChange(order.id, e.target.value)
                      }
                      className="ml-1 border border-gray-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      {FULFILLMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-gray-600 font-medium">
                    Delivery
                    <select
                      value={order.delivery}
                      onChange={(e) =>
                        handleDeliveryChange(order.id, e.target.value)
                      }
                      className={`ml-1 border rounded px-2 py-1 text-xs bg-white ${
                        order.delivery === "Delivered"
                          ? "border-green-300 text-green-800"
                          : order.delivery === "Undelivered"
                            ? "border-red-300 text-red-800"
                            : "border-gray-200"
                      }`}
                    >
                      {DELIVERY_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-gray-600 font-medium">
                    Tracking No.
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="text"
                        value={
                          trackingInputs[order.id] ?? order.trackingNumber ?? ""
                        }
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveTracking(order.id)
                        }
                        placeholder="Enter tracking no."
                        className="border border-gray-200 rounded px-2 py-1 text-xs bg-white w-[150px] focus:outline-none focus:border-green-400"
                      />
                      <button
                        onClick={() => handleSaveTracking(order.id)}
                        className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${
                          savedTrackingIds[order.id]
                            ? "bg-green-600 border-green-700 text-white"
                            : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        }`}
                        title="Save"
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </label>
                  {order.delivery === "Undelivered" && (
                    <input
                      type="text"
                      value={order.deliveryReason || ""}
                      onChange={(e) =>
                        setDeliveryReason(order.id, e.target.value)
                      }
                      placeholder="Undelivered reason…"
                      className="border border-red-200 rounded px-2 py-1 text-xs bg-white min-w-[200px]"
                    />
                  )}
                </div>

                {/* ── Live invoice preview (iframe = exactly what prints) ── */}
                <div className="flex-1 overflow-hidden rounded-b-2xl md:rounded-b-xl">
                  <iframe
                    ref={iframeRef}
                    srcDoc={buildInvoiceHtml(order)}
                    title="Invoice preview"
                    className="w-full border-0 h-[55vh] md:h-[72vh]"
                  />
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
