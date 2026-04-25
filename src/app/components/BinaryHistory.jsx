"use client";
import { useState, useEffect } from "react";
import { T, S, usd, f2 } from "../lib/store";
import { getBinaryTrades } from "../lib/api";
import { BHdr } from "./UI";

export default function BinaryHistory({ user, back }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    const fetchBinaryTrades = async () => {
      setLoading(true);
      try {
        const localUser = S.users?.[user?.username];
        const localBinaryTrades = (localUser?.transactions || []).filter(
          (t) => t.isBinaryTrade === true || t.type === "Binary Trade"
        );
        
        let backendTrades = [];
        if (user?.username) {
          const res = await getBinaryTrades(user.username);
          if (res && !res.error && Array.isArray(res)) {
            backendTrades = res;
          }
        }
        
        const allTrades = [...backendTrades];
        localBinaryTrades.forEach(localTrade => {
          const exists = allTrades.some(t => t.date === localTrade.date && t.coin === localTrade.coin);
          if (!exists) {
            allTrades.push(localTrade);
          }
        });
        
        allTrades.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTrades(allTrades);
      } catch (error) {
        console.error("Failed to fetch binary trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBinaryTrades();
  }, [user?.username]);

  const getFilteredTrades = () => {
    let filtered = [...trades];
    
    if (filter === "win") {
      filtered = filtered.filter(t => t.up === true);
    } else if (filter === "loss") {
      filtered = filtered.filter(t => t.up === false);
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (timeFilter === "today") {
      filtered = filtered.filter(t => new Date(t.date) >= today);
    } else if (timeFilter === "week") {
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (timeFilter === "month") {
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    }
    
    return filtered;
  };

  const filteredTrades = getFilteredTrades();
  
  const stats = {
    totalTrades: trades.length,
    wins: trades.filter(t => t.up === true).length,
    losses: trades.filter(t => t.up === false).length,
    winRate: trades.length > 0 
      ? ((trades.filter(t => t.up === true).length / trades.length) * 100).toFixed(1)
      : 0,
    totalProfit: trades.reduce((sum, t) => {
      if (t.up) {
        const profit = t.profitAmount || (t.amount * (t.profitPercent / 100));
        return sum + profit;
      }
      return sum - (t.amount || 0);
    }, 0),
    totalWagered: trades.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalReturned: trades.reduce((sum, t) => {
      if (t.up) {
        const profit = t.profitAmount || (t.amount * (t.profitPercent / 100));
        return sum + (t.amount + profit);
      }
      return sum;
    }, 0),
  };

  return (
    <div 
      style={{ 
        flex: 1, 
        overflowY: "auto", 
        paddingBottom: 20,
        scrollbarWidth: "none",  // Firefox
        msOverflowStyle: "none",  // IE/Edge
      }}
      className="hide-scrollbar"
    >
      <BHdr title="Binary Trading History" back={back} />
      
      {/* Stats Cards */}
      <div style={{ padding: "15px 13px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 15,
          }}
        >
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              border: `1px solid ${T.line}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: T.acc }}>
              {stats.totalTrades}
            </div>
            <div style={{ fontSize: 9, color: T.dim }}>Total Trades</div>
          </div>
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              border: `1px solid ${T.line}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: T.green }}>
              {stats.wins}
            </div>
            <div style={{ fontSize: 9, color: T.dim }}>Wins</div>
          </div>
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              border: `1px solid ${T.line}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: T.red }}>
              {stats.losses}
            </div>
            <div style={{ fontSize: 9, color: T.dim }}>Losses</div>
          </div>
          <div
            style={{
              background: T.card,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: stats.winRate >= 50 ? T.green : T.red,
              }}
            >
              {stats.winRate}%
            </div>
            <div style={{ fontSize: 9, color: T.dim }}>Win Rate</div>
          </div>
        </div>

        {/* Profit/Loss Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #0c2340, #1a3a5c)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 15,
          }}
        >
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
            TOTAL P&L (Binary Trading)
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: stats.totalProfit >= 0 ? T.green : T.red,
            }}
          >
            {stats.totalProfit >= 0 ? "+" : ""}{usd(stats.totalProfit)}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <span>Total Wagered: {usd(stats.totalWagered)}</span>
            <span>Total Returned: {usd(stats.totalReturned)}</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "all", label: "All Trades", color: T.acc },
            { id: "win", label: "✅ Wins Only", color: T.green },
            { id: "loss", label: "❌ Losses Only", color: T.red },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${filter === f.id ? f.color : T.line}`,
                background: filter === f.id ? `${f.color}15` : T.card,
                color: filter === f.id ? f.color : T.dim,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 15,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 15,
                border: `1px solid ${timeFilter === t.id ? T.acc : T.line}`,
                background: timeFilter === t.id ? "rgba(0,229,176,0.1)" : "transparent",
                color: timeFilter === t.id ? T.acc : T.dim,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trades List */}
      <div style={{ padding: "0 13px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: T.dim, padding: 40 }}>
            Loading history...
          </div>
        ) : filteredTrades.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: T.dim,
              padding: 60,
              background: T.card,
              borderRadius: 16,
              border: `1px solid ${T.line}`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No binary trades yet</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>
              Go to Trade page to start trading
            </div>
          </div>
        ) : (
          filteredTrades.map((trade, index) => {
            const isWin = trade.up === true;
            const profitAmount = trade.profitAmount || (trade.amount * (trade.profitPercent / 100));
            const totalReturn = trade.amount + profitAmount;
            const duration = trade.duration || trade.tradeDetails?.duration || "?";
            const orderType = trade.orderType || trade.tradeDetails?.orderType || "up";
            const profitPercent = trade.profitPercent || trade.tradeDetails?.profitPercent || 0;
            
            return (
              <div
                key={index}
                style={{
                  background: T.card,
                  borderRadius: 14,
                  marginBottom: 10,
                  border: `1px solid ${isWin ? T.green : T.red}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    background: isWin ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 24 }}>
                        {isWin ? "🎉" : "💔"}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: isWin ? T.green : T.red,
                          }}
                        >
                          {isWin ? "WINNER" : "LOSS"}
                        </div>
                        <div style={{ fontSize: 10, color: T.dim }}>
                          {new Date(trade.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: isWin ? T.green : T.red,
                        }}
                      >
                        {isWin ? `+${usd(profitAmount)}` : `-${usd(trade.amount)}`}
                      </div>
                      <div style={{ fontSize: 9, color: T.dim }}>
                        {isWin ? `Total: ${usd(totalReturn)}` : `Lost: ${usd(trade.amount)}`}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 8,
                      paddingTop: 8,
                      borderTop: `1px solid ${T.line}`,
                      marginTop: 4,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 9, color: T.dim }}>Coin</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                        {trade.coin}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: T.dim }}>Wager</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>
                        {usd(trade.amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: T.dim }}>Duration</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>
                        {duration}s
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: T.dim }}>Direction</div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: orderType === "up" ? T.green : T.red,
                        }}
                      >
                        {orderType === "up" ? "📈 UP" : "📉 DOWN"}
                      </div>
                    </div>
                  </div>

                  {profitPercent > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 10px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 8,
                        fontSize: 10,
                        color: T.dim,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Profit Rate: {profitPercent}%</span>
                      <span>
                        Entry: ${(trade.startPrice || 0).toFixed(2)} → 
                        Exit: ${(trade.endPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Global style to hide scrollbar for this component */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}