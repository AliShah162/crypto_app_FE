"use client";
import { useState, useEffect,useRef,useCallback } from "react";
import { T, S, usd } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";
import { withdrawFunds, saveCardToBackend } from "../lib/api";
import { addUserNotification } from "../lib/notifications";
import { API_URL } from "../lib/config";


/* ══════════════════════════════════════════════════════════════
   KYC Image Upload Modal Component - FIXED with useRef
══════════════════════════════════════════════════════════════ */
function KYCUploadModal({ isOpen, onClose, onComplete }) {
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [panFrontPreview, setPanFrontPreview] = useState(null);
  const [panBackPreview, setPanBackPreview] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [panFrontFile, setPanFrontFile] = useState(null);
  const [panBackFile, setPanBackFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  
  // Refs for file inputs
  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const panFrontRef = useRef(null);
  const panBackRef = useRef(null);

  if (!isOpen) return null;

  const processFile = (file, type, setPreview, setFile) => {
    console.log("Processing file:", type, file?.name);
    
    if (!file) {
      console.log("No file provided");
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [type]: "Please upload JPG, PNG, or WEBP image" }));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [type]: "File size must be less than 5MB" }));
      return;
    }
    
    setErrors(prev => ({ ...prev, [type]: null }));
    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("Preview loaded for:", type);
      setPreview(e.target.result);
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setErrors(prev => ({ ...prev, [type]: "Failed to read file" }));
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarFrontChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'aadhaarFront', setAadhaarFrontPreview, setAadhaarFrontFile);
    }
    // Reset the input value so the same file can be selected again if needed
    if (aadhaarFrontRef.current) aadhaarFrontRef.current.value = '';
  };

  const handleAadhaarBackChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'aadhaarBack', setAadhaarBackPreview, setAadhaarBackFile);
    }
    if (aadhaarBackRef.current) aadhaarBackRef.current.value = '';
  };

  const handlePanFrontChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'panFront', setPanFrontPreview, setPanFrontFile);
    }
    if (panFrontRef.current) panFrontRef.current.value = '';
  };

  const handlePanBackChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'panBack', setPanBackPreview, setPanBackFile);
    }
    if (panBackRef.current) panBackRef.current.value = '';
  };

  const handleSubmit = async () => {
    console.log("Submitting KYC documents...");
    const newErrors = {};
    
    if (!aadhaarFrontFile) newErrors.aadhaarFront = "Aadhaar card front image is required";
    if (!aadhaarBackFile) newErrors.aadhaarBack = "Aadhaar card back image is required";
    if (!panFrontFile) newErrors.panFront = "PAN card front image is required";
    if (!panBackFile) newErrors.panBack = "PAN card back image is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setUploading(true);
    
    try {
      const sessionUser = localStorage.getItem("session");
      if (!sessionUser) {
        alert("Please login again");
        return;
      }
      
      const formData = new FormData();
      formData.append("aadhaarFront", aadhaarFrontFile);
      formData.append("aadhaarBack", aadhaarBackFile);
      formData.append("panFront", panFrontFile);
      formData.append("panBack", panBackFile);
      formData.append("username", sessionUser);
      
      console.log("Sending to backend...");
      const response = await fetch(`${API_URL}/api/users/kyc-submit`, {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      console.log("Backend response:", result);
      
      if (result.success) {
        alert("KYC documents submitted successfully! Awaiting admin verification.");
        onComplete();
        onClose();
      } else {
        setErrors({ upload: result.error || "Failed to upload documents" });
      }
    } catch (error) {
      console.error("KYC upload error:", error);
      setErrors({ upload: "Failed to upload documents. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const ImageUploadBox = ({ label, preview, error, required, onClick, hasFile }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: 0.5 }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </div>
      <div
        onClick={onClick}
        style={{
          border: `1.5px dashed ${error ? T.red : (hasFile ? T.green : T.line)}`,
          borderRadius: 12,
          background: T.card2,
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s",
        }}
      >
        {preview ? (
          <img 
            src={preview} 
            alt={label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              maxHeight: 150,
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 20 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 8 }}>
              Click to upload
            </div>
            <div style={{ fontSize: 8, color: T.dim, marginTop: 4 }}>
              JPG, PNG up to 5MB
            </div>
          </div>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>
          {error}
        </div>
      )}
      {hasFile && !error && (
        <div style={{ fontSize: 9, color: T.green, marginTop: 4 }}>
          ✓ Image uploaded
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: T.card,
          borderRadius: 20,
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${T.line}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${T.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: T.card,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
            KYC Verification
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              background: T.card2,
              cursor: "pointer",
              color: T.dim,
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪪</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Upload Required Documents
            </div>
            <div style={{ fontSize: 11, color: T.dim }}>
              Please upload clear images of your Aadhaar and PAN cards
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={aadhaarFrontRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleAadhaarFrontChange}
            style={{ display: "none" }}
          />
          <input
            ref={aadhaarBackRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleAadhaarBackChange}
            style={{ display: "none" }}
          />
          <input
            ref={panFrontRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handlePanFrontChange}
            style={{ display: "none" }}
          />
          <input
            ref={panBackRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handlePanBackChange}
            style={{ display: "none" }}
          />

          {/* Aadhaar Section */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 16 }}>
              📇 Aadhaar Card
            </div>
          </div>
          
          <ImageUploadBox
            label="Aadhaar Card Front"
            preview={aadhaarFrontPreview}
            error={errors.aadhaarFront}
            hasFile={!!aadhaarFrontFile}
            required
            onClick={() => aadhaarFrontRef.current?.click()}
          />
          
          <ImageUploadBox
            label="Aadhaar Card Back"
            preview={aadhaarBackPreview}
            error={errors.aadhaarBack}
            hasFile={!!aadhaarBackFile}
            required
            onClick={() => aadhaarBackRef.current?.click()}
          />

          {/* PAN Section */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 16 }}>
              💳 PAN Card
            </div>
          </div>
          
          <ImageUploadBox
            label="PAN Card Front"
            preview={panFrontPreview}
            error={errors.panFront}
            hasFile={!!panFrontFile}
            required
            onClick={() => panFrontRef.current?.click()}
          />
          
          <ImageUploadBox
            label="PAN Card Back"
            preview={panBackPreview}
            error={errors.panBack}
            hasFile={!!panBackFile}
            required
            onClick={() => panBackRef.current?.click()}
          />

          {errors.upload && (
            <div style={{ fontSize: 11, color: T.red, textAlign: "center", marginTop: 12, marginBottom: 12 }}>
              {errors.upload}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <PB
              lbl={uploading ? "Submitting..." : "Submit for Verification"}
              onClick={handleSubmit}
              dis={uploading}
            />
            <PB lbl="Cancel" onClick={onClose} ghost />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DepositPage
══════════════════════════════════════════════════════════════ */
export function DepositPage({ nav, onDeposit }) {
  const [step, ss] = useState(1);
  const [amt, sa] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bank");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errs, se] = useState({});
  const [showMessage, setShowMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [depositRequestId, setDepositRequestId] = useState(null);
  const [depositStatus, setDepositStatus] = useState(null);
  const fileInputRef = useRef(null);
  const presets = [1000, 3000, 5000, 10000, 15000, 50000];

  const currencyOptions = [
    { id: "INR", symbol: "₹", label: "INR", icon: "🇮🇳" },
    { id: "USD", symbol: "$", label: "USD", icon: "💵" }, 
    { id: "USDT", symbol: "₮", label: "USDT", icon: "🪙" },
    { id: "BNB", symbol: "BNB", label: "BNB", icon: "🔶" },
    { id: "BTC", symbol: "₿", label: "BTC", icon: "🟧" },
    { id: "ETH", symbol: "Ξ", label: "ETH", icon: "💜" },
    { id: "SOL", symbol: "◎", label: "SOL", icon: "🟣" },
  ];

  const paymentMethods = [
    { id: "bank", label: "🏦 Bank Transfer", description: "Send via bank wire" },
    { id: "crypto", label: "🪙 Crypto Transfer", description: "Send crypto to address" },
    { id: "upi", label: "📱 UPI", description: "Send via UPI" },
  ];

 // ✅ FIXED: Fetch payment details with user's refKey
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const sessionUser = localStorage.getItem("session");
        if (!sessionUser) {
          console.log("No session user found");
          return;
        }

        // ✅ STEP 1: Get the user's data to find their refKey
        const userResponse = await fetch(`${API_URL}/api/users/${sessionUser}`);
        const userData = await userResponse.json();
        
        if (userData.error) {
          console.error("Failed to fetch user data:", userData.error);
          return;
        }

        const userRefKey = userData.refKey;
        console.log("🔑 User refKey:", userRefKey);

        // ✅ STEP 2: Use the public endpoint with refKey
        if (userRefKey) {
          const response = await fetch(`${API_URL}/api/users/public/payment-details/${encodeURIComponent(userRefKey)}`);
          const data = await response.json();
          
          if (data.success) {
            console.log("✅ Payment details fetched:", data);
            setPaymentDetails(data.details);
            setAdminName(data.adminName);
          } else {
            console.error("Failed to fetch payment details:", data.error);
          }
        } else {
          // Fallback: User has no refKey, try global settings
          console.log("⚠️ No refKey found, using global settings");
          const response = await fetch(`${API_URL}/api/users/admin/payment-details`);
          const data = await response.json();
          if (data.success) {
            setPaymentDetails(data.details);
            setAdminName("Default Admin");
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment details:", err);
      }
    };
    
    fetchPaymentDetails();
  }, []);

  useEffect(() => {
    if (!depositRequestId) return;
    
    const checkStatus = async () => {
      try {
        const sessionUser = localStorage.getItem("session");
        if (!sessionUser) return;
        
        const response = await fetch(`${API_URL}/api/users/${sessionUser}/deposit-status/${depositRequestId}`);
        const data = await response.json();
        
        if (data.status === "approved") {
          setDepositStatus("approved");
        } else if (data.status === "rejected") {
          setDepositStatus("rejected");
        }
      } catch (err) {
        console.error("Failed to check deposit status:", err);
      }
    };
    
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [depositRequestId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      se({ screenshot: "Please upload JPG, PNG, or WEBP image" });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      se({ screenshot: "File size must be less than 10MB" });
      return;
    }

    se({ screenshot: null });
    setScreenshotFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const e = {};
    if (!selectedPaymentMethod) e.paymentMethod = "Please select a payment method";
    if (!screenshotFile) e.screenshot = "Please upload a payment screenshot";
    se(e);
    return Object.keys(e).length === 0;
  };

  const handleDepositRequest = async () => {
    const amount = parseFloat(amt);
    if (!amount || amount <= 0) {
      se({ amt: "Enter a valid amount" });
      return;
    }
    if (!validateForm()) return;

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("username", sessionUser);
      formData.append("amount", amount.toString());
      formData.append("currency", selectedCurrency);
      formData.append("paymentMethod", selectedPaymentMethod);
      if (screenshotFile) {
        formData.append("screenshot", screenshotFile);
      }

      const response = await fetch(`${API_URL}/api/users/deposit-request`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setDepositRequestId(data.requestId);
        setShowMessage(true);
      } else {
        alert("Failed to submit deposit request: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Deposit request error:", error);
      alert("Failed to submit deposit request. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (depositStatus === "approved" && paymentDetails) {
    const selectedMethod = paymentMethods.find(p => p.id === selectedPaymentMethod);
    const paymentInfo = paymentDetails[selectedPaymentMethod];
    const currencyInfo = currencyOptions.find(c => c.id === selectedCurrency);
    
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, background: T.bg }}>
        <div style={{ fontSize: 52, marginBottom: 11 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 5 }}>Deposit Approved!</div>
        <div style={{ fontSize: 13, color: T.green, marginBottom: 15 }}>
          Your deposit has been approved. Here are the payment details:
        </div>
        
        <div style={{ 
          background: "linear-gradient(135deg,#0c2340,#1a3a5c)", 
          borderRadius: 16, 
          padding: "20px", 
          width: "100%",
          maxWidth: 400,
          border: `1px solid rgba(0,229,176,0.2)`,
          boxShadow: "0 5px 18px rgba(0,0,0,0.4)",
          marginBottom: 20
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 7 }}>
            {selectedMethod?.label?.toUpperCase() || "PAYMENT DETAILS"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
            {currencyInfo?.icon || "💰"} {parseFloat(amt).toFixed(2)} {selectedCurrency}
          </div>
          
          <div style={{ 
  background: "rgba(255,255,255,0.05)", 
  borderRadius: 10, 
  padding: "12px 14px",
  border: "1px solid rgba(255,255,255,0.08)"
}}>
  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
    Send payment to:
  </div>
  
  {/* ✅ Show account number OR address (whichever exists) */}
  {(paymentInfo?.accountNumber || paymentInfo?.address) ? (
    <>
      <div style={{ 
        fontSize: 13, 
        color: T.acc, 
        fontFamily: "monospace", 
        wordBreak: "break-all",
        background: "rgba(0,0,0,0.3)",
        padding: "8px 10px",
        borderRadius: 8,
        marginBottom: 8
      }}>
        {paymentInfo.accountNumber || paymentInfo.address}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(paymentInfo.accountNumber || paymentInfo.address);
          alert("Account number copied to clipboard!");
        }}
        style={{
          fontSize: 11,
          color: T.acc,
          background: "rgba(0,229,176,0.1)",
          border: `1px solid ${T.acc}`,
          borderRadius: 6,
          padding: "4px 12px",
          cursor: "pointer",
          marginBottom: 8
        }}
      >
        📋 Copy Account Number
      </button>
    </>
  ) : (
    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
      Payment details not configured by admin yet.
    </div>
  )}

  {/* ✅ Bank Details Grid - Shows all info clearly */}
<div style={{ 
  marginTop: 8, 
  paddingTop: 8, 
  borderTop: "1px solid rgba(255,255,255,0.05)",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "4px 12px",
  fontSize: 11,
  color: "rgba(255,255,255,0.7)"
}}>
  {/* ✅ Account Number - Most important, always show first */}
  {paymentInfo?.accountNumber && (
    <div style={{ gridColumn: "span 2", marginBottom: 4 }}>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>Account Number:</span> 
      <span style={{ fontWeight: 600, color: T.acc, fontFamily: "monospace", letterSpacing: "0.5px" }}>
        {paymentInfo.accountNumber}
      </span>
    </div>
  )}
  {paymentInfo?.bankName && (
    <div>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>Bank:</span> {paymentInfo.bankName}
    </div>
  )}
  {paymentInfo?.accountHolder && (
    <div>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>Account Holder:</span> {paymentInfo.accountHolder}
    </div>
  )}
  {paymentInfo?.ifsc && (
    <div>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>IFSC:</span> {paymentInfo.ifsc}
    </div>
  )}
  {paymentInfo?.additionalInfo && (
    <div style={{ gridColumn: "span 2" }}>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>Info:</span> {paymentInfo.additionalInfo}
    </div>
  )}
</div>
</div>
        </div>
        
        <PB lbl="Back to Home" onClick={() => { nav("home"); }} />
      </div>
    );
  }

  if (showMessage) {
    const currencyInfo = currencyOptions.find(c => c.id === selectedCurrency);
    const methodInfo = paymentMethods.find(p => p.id === selectedPaymentMethod);
    
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", background: T.bg }}>
        <div style={{ fontSize: 52, marginBottom: 11 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 5 }}>Deposit Request Submitted</div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>
          Amount: <span style={{ color: T.gold, fontWeight: 700 }}>
            {currencyInfo?.symbol || "$"}
            {parseFloat(amt).toFixed(2)} {selectedCurrency}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 15 }}>
          Payment Method: <span style={{ fontWeight: 600 }}>{methodInfo?.label || selectedPaymentMethod}</span>
        </div>
        <div style={{ fontSize: 13, color: T.acc, marginTop: 15, marginBottom: 20, padding: "15px", background: "rgba(0,229,176,0.1)", borderRadius: 12 }}>
          📢 Your deposit request has been submitted. Please wait for admin approval.
          <br />
          <span style={{ fontSize: 11, color: T.dim, display: "block", marginTop: 6 }}>
            A screenshot of your payment has been attached for verification.
          </span>
        </div>
        <PB lbl="Back to Home" onClick={() => { ss(1); sa(""); setScreenshotFile(null); setScreenshotPreview(null); setShowMessage(false); nav("home"); }} />
      </div>
    );
  }

  if (step === 2) {
    const methodDetails = paymentMethods.find(p => p.id === selectedPaymentMethod);
    const paymentInfo = paymentDetails?.[selectedPaymentMethod];
    const currencyInfo = currencyOptions.find(c => c.id === selectedCurrency);

    return (
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20, background: T.bg }}>
        <BHdr title="Payment Details" back={() => ss(1)} />
        <div style={{ padding: "13px 13px 0" }}>
          <div style={{ background: "linear-gradient(135deg,#0c2340,#1a3a5c)", borderRadius: 16, padding: "17px 15px", marginBottom: 14, boxShadow: "0 5px 18px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 7 }}>
              {methodDetails?.label?.toUpperCase() || "PAYMENT DETAILS"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
              {currencyInfo?.icon || "💰"} {parseFloat(amt).toFixed(2)} {selectedCurrency}
            </div>
            
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 10, 
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Send payment to:
              </div>
              {paymentInfo?.address ? (
                <>
                  <div style={{ 
                    fontSize: 13, 
                    color: T.acc, 
                    fontFamily: "monospace", 
                    wordBreak: "break-all",
                    background: "rgba(0,0,0,0.3)",
                    padding: "8px 10px",
                    borderRadius: 8,
                    marginBottom: 8
                  }}>
                    {paymentInfo.address}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentInfo.address);
                      alert("Address copied to clipboard!");
                    }}
                    style={{
                      fontSize: 11,
                      color: T.acc,
                      background: "rgba(0,229,176,0.1)",
                      border: `1px solid ${T.acc}`,
                      borderRadius: 6,
                      padding: "4px 12px",
                      cursor: "pointer"
                    }}
                  >
                    📋 Copy Address
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Please wait for admin to provide payment details.
                </div>
              )}
              {paymentInfo?.additionalInfo && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {paymentInfo.additionalInfo}
                </div>
              )}
              {paymentInfo?.bankName && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  Bank: {paymentInfo.bankName} · Account: {paymentInfo.accountHolder}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: T.card, borderRadius: 13, padding: "14px 13px", marginBottom: 11, border: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Upload Payment Screenshot
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 12 }}>
              Please upload a screenshot of your payment confirmation.
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1.5px dashed ${errs.screenshot ? T.red : T.line}`,
                borderRadius: 12,
                background: T.card2,
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                minHeight: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s",
              }}
            >
              {screenshotPreview ? (
                <img 
                  src={screenshotPreview} 
                  alt="Payment Screenshot"
                  style={{ width: "100%", height: "auto", maxHeight: 200, objectFit: "contain" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 8 }}>Click to upload screenshot</div>
                  <div style={{ fontSize: 8, color: T.dim, marginTop: 4 }}>JPG, PNG up to 10MB</div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {errs.screenshot && (
              <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errs.screenshot}</div>
            )}
            {screenshotFile && !errs.screenshot && (
              <div style={{ fontSize: 9, color: T.green, marginTop: 4 }}>✓ Screenshot uploaded</div>
            )}
          </div>

          <PB 
            lbl={uploading ? "Submitting..." : "Confirm Payment"} 
            onClick={handleDepositRequest} 
            dis={uploading || !screenshotFile} 
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20, scrollbarWidth: "none", msOverflowStyle: "none", background: T.bg }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      <BHdr title="Deposit" back={() => nav("home")} />
      <div style={{ padding: "13px 13px 0" }}>
        <div style={{ background: T.card, borderRadius: 13, padding: "13px", marginBottom: 11, border: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, letterSpacing: 1, marginBottom: 7 }}>
            PAYMENT METHOD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                style={{
                  background: selectedPaymentMethod === method.id ? "rgba(0,229,176,0.09)" : T.card2,
                  border: `1.5px solid ${selectedPaymentMethod === method.id ? T.acc : T.line}`,
                  borderRadius: 9,
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>{method.icon || "💳"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedPaymentMethod === method.id ? T.acc : T.text }}>
                    {method.label}
                  </div>
                  <div style={{ fontSize: 10, color: T.dim }}>{method.description}</div>
                </div>
                {selectedPaymentMethod === method.id && (
                  <span style={{ color: T.acc, fontSize: 16 }}>✓</span>
                )}
              </div>
            ))}
          </div>
          {errs.paymentMethod && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>{errs.paymentMethod}</div>
          )}
        </div>

        <div style={{ background: T.card, borderRadius: 13, padding: "13px", marginBottom: 11, border: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, letterSpacing: 1, marginBottom: 7 }}>
            CURRENCY
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {currencyOptions.map((curr) => (
              <button
                key={curr.id}
                onClick={() => setSelectedCurrency(curr.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${selectedCurrency === curr.id ? T.acc : T.line}`,
                  background: selectedCurrency === curr.id ? "rgba(0,229,176,0.09)" : T.card2,
                  color: selectedCurrency === curr.id ? T.acc : T.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {curr.icon} {curr.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: 13, padding: "15px 13px", marginBottom: 11, border: `1px solid ${T.line}` }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 3 }}>
              Deposit Amount
            </div>
            <div style={{ fontSize: 11, color: T.dim }}>Choose preset or enter custom</div>
          </div>
          <input
            type="number"
            value={amt}
            onChange={(e) => sa(e.target.value)}
            placeholder={`Enter amount (${selectedCurrency})`}
            style={{
              width: "100%",
              background: T.card2,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "12px 13px",
              fontSize: 17,
              color: T.text,
              outline: "none",
              textAlign: "center",
              marginBottom: 11,
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {presets.map((p) => (
  <button
    key={p}
    onClick={() => sa(String(p))}
    style={{
      background: amt === String(p) ? "rgba(0,229,176,0.09)" : T.card2,
      border: `1.5px solid ${amt === String(p) ? T.acc : T.line}`,
      borderRadius: 9,
      padding: "8px 0",
      fontSize: 11,
      fontWeight: 600,
      color: amt === String(p) ? T.acc : T.text,
      cursor: "pointer",
      fontFamily: "inherit",
    }}
  >
    {currencyOptions.find(c => c.id === selectedCurrency)?.symbol || "$"}
    {p >= 1000 ? `${p / 1000}K` : p}
  </button>
))}
          </div>
          {errs.amt && <div style={{ fontSize: 11, color: T.red, marginTop: 8 }}>{errs.amt}</div>}
        </div>

        <PB
          lbl="Continue to Payment →"
          onClick={() => {
            if (amt && parseFloat(amt) > 0) ss(2);
          }}
          dis={!amt || parseFloat(amt) <= 0}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WithdrawPage - Complete with all fields and KYC check
══════════════════════════════════════════════════════════════ */
export function WithdrawPage({ nav, onWithdraw, user }) {
  const [step, ss] = useState(1);
  const [cards, sc] = useState([]);
  const [selC, ssel] = useState(null);
  const [amt, sa] = useState("");
  const [pw, spw] = useState("");
  const [errs, se] = useState({});
  const [nc, snc] = useState({
    holderName: "",
    bankName: "",
    accNumber: "",
    ifc: "",
  });
  const [adding, sad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bal, setBal] = useState(0);
  const [creditScore, setCreditScore] = useState(50);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [kycPending, setKycPending] = useState(false);

  // Check KYC status on mount and periodically
  const checkKYCStatus = useCallback(async () => {
    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${sessionUser}/kyc-status`);
      const data = await response.json();
      setKycStatus(data);
      
      if (data.kycVerified === true) {
        setKycVerified(true);
        setKycPending(false);
      } else if (data.kycSubmitted === true && data.kycStatus === "pending") {
        setKycVerified(false);
        setKycPending(true);
      } else {
        setKycVerified(false);
        setKycPending(false);
      }
    } catch (err) {
      console.error("Failed to check KYC status:", err);
    }
  }, []);

  useEffect(() => {
    checkKYCStatus();
    const interval = setInterval(checkKYCStatus, 10000);
    return () => clearInterval(interval);
  }, [checkKYCStatus]);

  const fetchUserData = async () => {
    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${sessionUser}`);
      const data = await res.json();
      if (!data.error) {
        setBal(data.balance || 0);
        setCreditScore(data.creditScore || 50);
        const mappedCards = (data.savedCards || []).map((card) => ({
          id: card.id,
          holderName: card.holderName || card.name || "",
          bankName: card.bankName || "",
          accNumber: card.accNumber || card.num || "",
          ifc: card.ifc || card.cvv || "",
          display:
            card.display ||
            `${card.bankName || card.name || "Bank"} - ****${(card.accNumber || card.num || "").slice(-4)}`,
        }));
        sc(mappedCards);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
    const handleFocus = () => fetchUserData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  
  useEffect(() => {
    fetchUserData();
  }, [user?.username]);

  const handleKYCComplete = () => {
    setShowKYCModal(false);
    checkKYCStatus();
  };

  const handleConfirmWithdraw = () => {
    if (!kycVerified) {
      if (kycPending) {
        alert("⚠️ Your KYC is under review. Please wait for admin approval.");
      } else {
        setShowKYCModal(true);
      }
      return;
    }
    confirm();
  };

  const formatAccountNumber = (value) => value.replace(/\s/g, "");

  const saveCard = async () => {
    const e = {};
    if (!nc.holderName.trim()) e.holderName = "Account holder name is required";
    if (!nc.bankName.trim()) e.bankName = "Bank name is required";
    if (!nc.accNumber.trim()) e.accNumber = "Account number is required";
    if (!nc.ifc.trim()) e.ifc = "IFC code is required";
    se(e);
    if (Object.keys(e).length) return;

    const newCard = {
      id: Date.now(),
      holderName: nc.holderName.toUpperCase(),
      bankName: nc.bankName,
      accNumber: nc.accNumber,
      ifc: nc.ifc,
      cvv: nc.ifc,
      display: `${nc.bankName} - ****${nc.accNumber.slice(-4)}`,
    };

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/users/${sessionUser}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: newCard }),
        },
      );
      const result = await response.json();
      if (result.success) {
        const updatedCards = [...cards, newCard];
        sc(updatedCards);
        ssel(newCard);
        snc({ holderName: "", bankName: "", accNumber: "", ifc: "" });
        sad(false);
        se({});
        alert("Bank account saved successfully!");
      } else {
        alert(result.error || "Failed to save account");
      }
    } catch (err) {
      alert("Failed to save account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    const e = {};
    if (!selC) e.card = "Select an account first";
    const a = parseFloat(amt);
    if (!amt || isNaN(a) || a <= 0) e.amt = "Enter valid amount";
    else if (a > bal) e.amt = `Exceeds balance (${usd(bal)})`;
    if (!pw) e.pw = "Required";
    if (creditScore < 90)
      e.creditScore =
        "Your credit score is less than 90. You cannot apply for withdrawal";
    se(e);
    if (Object.keys(e).length) return;

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    setLoading(true);
    try {
      const withdrawalData = {
        username: sessionUser,
        amount: a,
        cardId: selC.id,
        password: pw,
        holderName: selC.holderName,
        bankName: selC.bankName,
        accNumber: selC.accNumber,
        ifc: selC.ifc,
        cvv: selC.ifc,
      };
      const result = await withdrawFunds(
        withdrawalData.username,
        withdrawalData.amount,
        withdrawalData.cardId,
        withdrawalData.password,
        withdrawalData,
      );
      if (result.error) {
        if (result.error.toLowerCase().includes("password"))
          se({ pw: "Incorrect password" });
        else se({ amt: result.error });
      } else {
        await fetch(`${API_URL}/api/users/${sessionUser}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "💸 Withdrawal Requested",
            body: `${usd(a)} withdrawal request submitted for approval`,
          }),
        });
        ss(2);
      }
    } catch (error) {
      se({ amt: "Withdrawal failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
          background: T.bg,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 11 }}>🏦</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          Withdrawal Requested
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>
          Withdrawing{" "}
          <span style={{ color: T.red, fontWeight: 700 }}>
            {usd(parseFloat(amt))}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>
          Request submitted for approval
        </div>
        <PB
          lbl="Back to Home"
          onClick={() => {
            ss(1);
            sa("");
            spw("");
            nav("home");
          }}
        />
      </div>
    );
  }

  if (kycStatus === null && (kycVerified === false && kycPending === false)) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.bg,
        }}
      >
        <div style={{ fontSize: 14, color: T.dim }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 20,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        background: T.bg,
      }}
    >
      <style>
        {`
        div::-webkit-scrollbar {
          display: none;
        }
      `}
      </style>
      
      <KYCUploadModal 
        isOpen={showKYCModal} 
        onClose={() => setShowKYCModal(false)}
        onComplete={handleKYCComplete}
      />
      
      <BHdr title="Withdraw" back={() => nav("home")} />
      <div style={{ padding: "13px 13px 0" }}>
        {/* WITHDRAW TO - Bank Account Selection */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            WITHDRAW TO
          </div>

          {cards.length === 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                border: `1.5px dashed ${T.line}`,
                borderRadius: 10,
                padding: "11px 0",
                textAlign: "center",
                fontSize: 12,
                color: T.dim,
                cursor: "pointer",
              }}
            >
              ＋ Add Bank Account
            </div>
          )}

         {cards.map((c) => (
  <div
    key={c.id}
    onClick={() => ssel(c)}
    style={{
      background: selC?.id === c.id ? "rgba(0,229,176,0.07)" : T.card2,
      border: `1.5px solid ${selC?.id === c.id ? T.acc : T.line}`,
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 8,
      cursor: "pointer",
      transition: "all 0.2s",
    }}
  >
    {/* Selected indicator */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div style={{ 
        fontSize: 10, 
        fontWeight: 700, 
        color: selC?.id === c.id ? T.acc : T.dim,
        background: selC?.id === c.id ? `${T.acc}15` : "transparent",
        padding: "2px 8px",
        borderRadius: 12,
      }}>
        {selC?.id === c.id ? "✓ SELECTED" : "CLICK TO SELECT"}
      </div>
      {selC?.id === c.id && (
        <span style={{ color: T.acc, fontSize: 16 }}>✓</span>
      )}
    </div>

    {/* Bank Name - Prominent */}
    <div style={{ 
      fontSize: 15, 
      fontWeight: 800, 
      color: T.text,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: `1px solid ${T.line}`,
    }}>
      🏦 {c.bankName || "Bank Account"}
    </div>

    {/* Account Details Grid */}
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 1fr", 
      gap: "8px 12px",
      marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: 9, color: T.dim, marginBottom: 2 }}>Account Holder</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, wordBreak: "break-all" }}>
          {c.holderName || "—"}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: T.dim, marginBottom: 2 }}>Bank Name</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, wordBreak: "break-all" }}>
          {c.bankName || "—"}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: T.dim, marginBottom: 2 }}>Account Number</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: "monospace", letterSpacing: "0.5px" }}>
          {c.accNumber || c.num || "—"}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: T.dim, marginBottom: 2 }}>IFC / CVV</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
          {c.ifc || c.cvv || "—"}
        </div>
      </div>
    </div>

    {/* Display (last 4 digits or reference) */}
    <div style={{ 
      fontSize: 9, 
      color: T.dim, 
      marginTop: 6,
      paddingTop: 6,
      borderTop: `1px solid ${T.line}`,
      textAlign: "right",
    }}>
      {c.display || `Account ending in ${(c.accNumber || c.num || "").slice(-4)}`}
    </div>
  </div>
))}

          {cards.length > 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                textAlign: "center",
                fontSize: 11,
                color: T.acc,
                cursor: "pointer",
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              ＋ Add another account
            </div>
          )}

          {adding && (
            <div
              style={{
                background: T.card2,
                borderRadius: 10,
                padding: "11px",
                marginTop: 6,
                border: `1px solid ${T.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.text,
                  marginBottom: 9,
                }}
              >
                Add Bank Account
              </div>
              <Input
                label="ACCOUNT HOLDER NAME"
                val={nc.holderName}
                set={(v) => snc((p) => ({ ...p, holderName: v.toUpperCase() }))}
                ph="Name on account"
                err={errs.holderName}
              />
              <Input
                label="BANK NAME"
                val={nc.bankName}
                set={(v) => snc((p) => ({ ...p, bankName: v }))}
                ph="e.g., Chase Bank"
                err={errs.bankName}
              />
              <Input
                label="ACCOUNT NUMBER"
                val={nc.accNumber}
                set={(v) =>
                  snc((p) => ({ ...p, accNumber: formatAccountNumber(v) }))
                }
                ph="Enter account number"
                err={errs.accNumber}
              />
              <Input
                label="IFC CODE"
                type="text"
                val={nc.ifc}
                set={(v) => {
                  const cleaned = v.replace(/\s/g, "");
                  snc((p) => ({ ...p, ifc: cleaned.toUpperCase() }));
                }}
                ph="Enter IFC code"
                err={errs.ifc}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <PB lbl="Save" onClick={saveCard} sm />
                <PB
                  lbl="Cancel"
                  onClick={() => {
                    sad(false);
                    se({});
                    snc({
                      holderName: "",
                      bankName: "",
                      accNumber: "",
                      ifc: "",
                    });
                  }}
                  ghost
                  sm
                />
              </div>
            </div>
          )}
          {errs.card && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>
              {errs.card}
            </div>
          )}
        </div>

        {/* AMOUNT */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            AMOUNT
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amt}
              onChange={(e) => sa(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: "100%",
                background: T.card2,
                border: `1.5px solid ${errs.amt ? T.red : T.line}`,
                borderRadius: 10,
                padding: "11px 60px 11px 12px",
                fontSize: 13,
                color: T.text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span
              onClick={() => sa(String(Math.floor(bal)))}
              style={{
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                fontWeight: 800,
                color: T.blue,
                cursor: "pointer",
              }}
            >
              MAX
            </span>
          </div>
          {errs.amt && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 3 }}>
              {errs.amt}
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: T.dim,
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Available</span>
            <strong style={{ color: T.text }}>{usd(bal)}</strong>
          </div>
        </div>

        {/* TRANSACTION PASSWORD */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 16,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            TRANSACTION PASSWORD
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => spw(e.target.value)}
            placeholder="Your account password"
            style={{
              width: "100%",
              background: T.card2,
              border: `1.5px solid ${errs.pw ? T.red : T.line}`,
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 13,
              color: T.text,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {errs.pw && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 3 }}>
              {errs.pw}
            </div>
          )}
        </div>

        {/* KYC Status Banners */}
        {kycPending && (
          <div
            style={{
              background: "rgba(245,158,11,0.1)",
              border: `1px solid ${T.gold}`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 24 }}>⏳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 2 }}>
                KYC Under Review
              </div>
              <div style={{ fontSize: 11, color: T.dim }}>
                Your documents are being verified by admin. You cannot withdraw until approved.
              </div>
            </div>
          </div>
        )}

        {!kycVerified && !kycPending && (
          <div
            style={{
              background: "rgba(0,229,176,0.08)",
              border: `1px solid rgba(0,229,176,0.2)`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            onClick={() => setShowKYCModal(true)}
          >
            <div style={{ fontSize: 24 }}>🪪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 2 }}>
                KYC Verification Required
              </div>
              <div style={{ fontSize: 11, color: T.dim }}>
                Click here to upload your Aadhaar & PAN card images
              </div>
            </div>
            <div style={{ color: T.acc, fontSize: 20 }}>→</div>
          </div>
        )}

        {kycVerified && (
          <div
            style={{
              background: "rgba(16,185,129,0.08)",
              border: `1px solid rgba(16,185,129,0.2)`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✅</span>
            <span style={{ fontSize: 12, color: T.green }}>KYC Verified - You can withdraw funds</span>
          </div>
        )}

        {errs.creditScore && (
          <div
            style={{
              fontSize: 13,
              color: T.red,
              marginBottom: 10,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {errs.creditScore}
          </div>
        )}

        {/* Confirm Button */}
        <PB
          lbl={loading ? "Processing..." : "Confirm Withdrawal"}
          onClick={handleConfirmWithdraw}
          dis={loading || kycPending || (!kycVerified && !kycPending === false)}
        />
        
        {kycPending && (
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.gold }}>
            ⏳ Withdrawal unavailable while KYC is under review
          </div>
        )}
      </div>
    </div>
  );
}