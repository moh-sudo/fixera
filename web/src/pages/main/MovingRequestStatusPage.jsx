import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { Btn, Card } from '../../components/UI';
import MovingSupportSection from '../../components/MovingSupportSection';
import LiveMap from '../../components/LiveMap';
import PaymentPrompt from '../../components/PaymentPrompt';
import { docFromMoverQuote } from '../../services/documentService';
import { downloadDocument } from '../../utils/fixeraDocument';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import {
  getMovingRequest,
  getMovingQuotes,
  acceptQuote,
  declineQuote,
  cancelMovingRequest,
  signOffDelivery,
  reportMovingIssue,
} from '../../services/movingService';

const STATUS_LABEL = {
  awaiting_quotes: { label: 'Awaiting Quotes', color: C.warning, icon: '⏳' },
  quoted:          { label: 'Quotes Received', color: C.info,    icon: '📋' },
  accepted:        { label: 'Mover Confirmed', color: C.success, icon: '✅' },
  in_progress:     { label: 'Move In Progress', color: C.gold,   icon: '🚚' },
  delivered:       { label: 'Confirm Delivery', color: '#9F7AEA', icon: '📦' },
  completed:       { label: 'Completed',        color: C.success, icon: '🎉' },
  cancelled:       { label: 'Cancelled',         color: C.error,   icon: '❌' },
};

const ROLE_META = {
  team_leader: { label: 'Team Leader / Supervisor', icon: '⭐', color: C.gold },
  driver:      { label: 'Driver',                    icon: '🚗', color: C.info },
  loader:      { label: 'Loader',                    icon: '💪', color: '#48BB78' },
  packer:      { label: 'Packer',                    icon: '📦', color: '#B794F4' },
};

export default function MovingRequestStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [quotes, setQuotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      const req = await getMovingRequest(id);
      setRequest(req);
      const qs = await getMovingQuotes(id);
      setQuotes(qs);
    } catch (err) {
      console.error('Failed to load moving request:', err);
      setError('Could not load your moving request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  // Realtime: refresh automatically when the mover updates the request
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`moving_req_${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'moving_requests', filter: `id=eq.${id}` },
        payload => setRequest(payload.new)
      )
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  const handleAccept = async (quoteId) => {
    try {
      await acceptQuote(id, quoteId);
      await load();
    } catch (err) {
      console.error(err);
      alert('Could not accept the quote. Please try again.');
    }
  };

  const handleDecline = async (quoteId) => {
    try {
      await declineQuote(quoteId);
      await load();
    } catch (err) { console.error(err); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this moving request?')) return;
    try {
      await cancelMovingRequest(id);
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Could not cancel the request.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, color: C.textMuted, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading your moving request…
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Request not found</div>
        <div style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>{error}</div>
        <Btn onClick={() => navigate('/home')}>Back to Home</Btn>
      </div>
    );
  }

  const status = STATUS_LABEL[request.status] || STATUS_LABEL.awaiting_quotes;
  const acceptedQuote = quotes.find(q => q.status === 'accepted');

  return (
    <div style={{ padding: '24px 24px 100px', minHeight: '100vh', background: C.navy }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={() => navigate('/home')} style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.navyBorder}`,
          background: C.navyLight, color: C.textPrimary, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.textPrimary, fontSize: 20, fontWeight: 900 }}>📦 Your Moving Request</div>
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>#{request.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${status.color}18`, border: `1px solid ${status.color}50`,
          borderRadius: 999, padding: '6px 14px',
          color: status.color, fontSize: 12, fontWeight: 700,
        }}>
          {status.icon} {status.label}
        </div>
      </div>

      {/* Route summary */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold }} />
            <div style={{ width: 2, height: 24, background: C.navyBorder }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.info }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 2 }}>PICKUP</div>
            <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{request.pickup_location}</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 2 }}>DESTINATION</div>
            <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 600 }}>{request.destination}</div>
          </div>
        </div>
      </Card>

      {/* ── State: Awaiting Quotes ── */}
      {request.status === 'awaiting_quotes' && (
        <>
          <Card style={{ marginBottom: 16, background: `${C.warning}10`, border: `1px solid ${C.warning}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 36 }}>⏳</div>
              <div>
                <div style={{ color: C.warning, fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Waiting for movers to quote</div>
                <div style={{ color: C.textSec, fontSize: 13, lineHeight: 1.5 }}>
                  Nearby movers are reviewing your request. Quotes usually arrive within 30–120 minutes.
                </div>
              </div>
            </div>
          </Card>

          {quotes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                {quotes.length} quote{quotes.length === 1 ? '' : 's'} received so far
              </div>
              {quotes.map(q => <QuoteCard key={q.id} quote={q} onAccept={handleAccept} onDecline={handleDecline} />)}
            </div>
          )}

          <Btn variant="danger" onClick={handleCancel} style={{ width: '100%', marginTop: 8 }}>Cancel Request</Btn>
        </>
      )}

      {/* ── State: Quotes Received (Marketplace) ── */}
      {request.status === 'quoted' && (
        <>
          <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            Compare {quotes.length} quotes
          </div>
          <div style={{ color: C.textSec, fontSize: 13, marginBottom: 16 }}>
            Pick the mover that works best for you. Lower price isn't always best — check ratings and crew size too.
          </div>
          {quotes.map(q => <QuoteCard key={q.id} quote={q} onAccept={handleAccept} onDecline={handleDecline} />)}
        </>
      )}

      {/* ── State: Accepted (Team Assignment) ── */}
      {request.status === 'accepted' && (
        <>
          <Card style={{ marginBottom: 16, background: `${C.success}10`, border: `1px solid ${C.success}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <div>
                <div style={{ color: C.success, fontSize: 16, fontWeight: 800 }}>Mover confirmed!</div>
                <div style={{ color: C.textSec, fontSize: 13, marginTop: 2 }}>
                  {request.mover_company_name || (acceptedQuote && acceptedQuote.mover_name) || 'Your mover'} will arrive on the scheduled day.
                </div>
              </div>
            </div>
            {acceptedQuote && (
              <button onClick={() => downloadDocument(docFromMoverQuote(acceptedQuote, request))} style={{
                marginTop: 12, width: '100%', padding: '10px', borderRadius: 10,
                background: 'rgba(201,160,32,0.12)', border: `1px solid ${C.gold}40`,
                color: C.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>📄 Download Quotation</button>
            )}
          </Card>

          {/* Vehicle */}
          <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🚚 Assigned Vehicle</div>
          <Card style={{ marginBottom: 16 }}>
            {request.assigned_vehicle_plate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: `${C.gold}20`,
                  border: `1px solid ${C.gold}40`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 28,
                }}>🚛</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700 }}>
                    {acceptedQuote?.vehicle_type || 'Truck'}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Plate Number</div>
                  <div style={{
                    display: 'inline-block', marginTop: 4, padding: '4px 12px',
                    background: '#FFFFFF', color: '#000', fontSize: 14, fontWeight: 800,
                    borderRadius: 6, letterSpacing: 2, fontFamily: 'monospace',
                  }}>{request.assigned_vehicle_plate}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 8 }}>
                ⏳ Mover will assign vehicle shortly…
              </div>
            )}
          </Card>

          {/* Crew */}
          <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>👥 Your Moving Team</div>
          {Array.isArray(request.assigned_crew) && request.assigned_crew.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {request.assigned_crew.map((worker, i) => <CrewMemberCard key={i} worker={worker} />)}
            </div>
          ) : (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 8 }}>
                ⏳ Mover is assigning the crew — names &amp; photos will appear here before arrival.
              </div>
            </Card>
          )}

          {/* Support */}
          <div style={{ marginBottom: 16 }}>
            <MovingSupportSection
              requestId={request.id}
              moverPhone={request.mover_phone}
              moverCompany={request.mover_company_name}
            />
          </div>
        </>
      )}

      {/* ── State: In Progress ── */}
      {request.status === 'in_progress' && (
        <>
          <Card style={{ marginBottom: 16, background: `${C.gold}10`, border: `1px solid ${C.gold}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>🚚</div>
              <div>
                <div style={{ color: C.gold, fontSize: 16, fontWeight: 800 }}>Move in progress</div>
                <div style={{ color: C.textSec, fontSize: 13, marginTop: 2 }}>Track your move and report any issues below.</div>
              </div>
            </div>
          </Card>

          {/* Live GPS — truck heading to the destination */}
          <div style={{ marginBottom: 16 }}>
            <LiveMap
              movingRequestId={request.id}
              vehicleIcon="🚚"
              vehicleLabel="mover"
              destinationAddress={request.destination}
            />
          </div>

          {/* Loading verification photos taken at pickup */}
          {Array.isArray(request.loading_photo_urls) && request.loading_photo_urls.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                📸 LOADING PHOTOS — taken at pickup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                {request.loading_photo_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`loading ${i+1}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  </a>
                ))}
              </div>
            </Card>
          )}

          <div style={{ marginBottom: 16 }}>
            <MovingSupportSection
              requestId={request.id}
              moverPhone={request.mover_phone}
              moverCompany={request.mover_company_name}
            />
          </div>
        </>
      )}

      {/* ── State: Delivered — inventory check + digital sign-off ── */}
      {request.status === 'delivered' && (
        <DeliverySignOff
          request={request}
          userId={user?.id}
          onSigned={load}
        />
      )}

      {/* ── State: Completed ── */}
      {request.status === 'completed' && (
        <>
          {acceptedQuote && (
            <PaymentPrompt
              refType="moving_request" refId={request.id}
              payeeId={acceptedQuote.mover_id} payeeRole="mover"
              purpose="move" amount={Number(acceptedQuote.price || 0)}
              label={`Move — ${request.mover_company_name || 'Mover'}`}
            />
          )}
          <Card style={{ background: `${C.success}10`, border: `1px solid ${C.success}40`, textAlign: 'center', padding: '36px 20px', marginBottom: 14 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div style={{ color: C.success, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Move Completed!</div>
            {request.delivery_signature && (
              <div style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>
                Signed by <strong style={{ color: C.textPrimary }}>{request.delivery_signature}</strong>
                {request.delivery_signed_at && ` · ${new Date(request.delivery_signed_at).toLocaleString('en-KE')}`}
              </div>
            )}
            <div style={{ color: C.textSec, fontSize: 14, marginBottom: 20 }}>Thanks for using Fixera. How was your experience?</div>
            <Btn onClick={() => navigate(`/review/${request.id}`)}>Leave a Review</Btn>
          </Card>

          {/* Late claim entry — issues spotted after sign-off */}
          <Card style={{ background: `${C.warning}08`, border: `1px solid ${C.warning}30` }}>
            <div style={{ color: C.warning, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Found a problem after the move?</div>
            <div style={{ color: C.textSec, fontSize: 12, marginBottom: 10 }}>
              You can still report damaged or missing items — Fixera reviews every claim.
            </div>
            <Btn variant="outline" onClick={async () => {
              const description = prompt('Describe the damaged or missing item:');
              if (!description) return;
              try {
                await reportMovingIssue(request.id, user?.id, 'damage', description);
                alert('Claim submitted — our Trust & Safety team responds within 1 hour.');
              } catch (err) { console.error(err); alert('Could not submit the claim.'); }
            }} style={{ width: '100%' }}>🚨 Report Damage / Missing Item</Btn>
          </Card>
        </>
      )}

      {/* ── State: Cancelled ── */}
      {request.status === 'cancelled' && (
        <Card style={{ background: `${C.error}10`, border: `1px solid ${C.error}40`, textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <div style={{ color: C.error, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Request Cancelled</div>
          <Btn onClick={() => navigate('/movers')} style={{ marginTop: 12 }}>Start New Request</Btn>
        </Card>
      )}
    </div>
  );
}

// ─── Quote Card (used in awaiting_quotes + quoted states) ───
function QuoteCard({ quote, onAccept, onDecline }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 800 }}>{quote.mover_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ color: C.gold, fontSize: 13 }}>★</span>
            <span style={{ color: C.textSec, fontSize: 12 }}>{quote.mover_rating || '—'} rating</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.textMuted, fontSize: 10 }}>QUOTED PRICE</div>
          <div style={{ color: C.gold, fontSize: 22, fontWeight: 900 }}>KSh {Number(quote.price).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Chip icon="🚚" label={quote.vehicle_type} />
        <Chip icon="👥" label={`${quote.num_workers || 2} workers`} />
        {quote.eta && <Chip icon="⏱️" label={quote.eta} />}
        {quote.vehicle_plate && <Chip icon="🔢" label={quote.vehicle_plate} />}
      </div>

      {quote.message && (
        <div style={{ color: C.textSec, fontSize: 12, fontStyle: 'italic', marginBottom: 12, padding: 10, background: C.navy, borderRadius: 8 }}>
          "{quote.message}"
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="ghost" onClick={() => onDecline(quote.id)} style={{ flex: 1 }}>Decline</Btn>
        <Btn onClick={() => onAccept(quote.id)} style={{ flex: 2 }}>Accept Quote</Btn>
      </div>
    </Card>
  );
}

function Chip({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: C.navy, border: `1px solid ${C.navyBorder}`,
      borderRadius: 999, padding: '3px 10px',
      color: C.textSec, fontSize: 11, fontWeight: 600,
    }}>
      <span>{icon}</span>{label}
    </span>
  );
}

// ─── Delivery Sign-off (blueprint §12–13) ───
// Customer ticks each inventory item as received, reports problems
// per item, then signs with their full name to close the move.
function DeliverySignOff({ request, userId, onSigned }) {
  const inventory = Array.isArray(request.inventory) ? request.inventory : [];
  const [checks, setChecks] = useState(() =>
    inventory.map(it => ({ item: it.item || it.name || String(it), qty: it.qty || 1, received: true }))
  );
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (i) => setChecks(cs => cs.map((c, j) => j === i ? { ...c, received: !c.received } : c));
  const missing = checks.filter(c => !c.received);

  const handleSign = async () => {
    if (!signature.trim()) return;
    if (missing.length > 0 && !confirm(
      `You marked ${missing.length} item(s) as NOT received:\n${missing.map(m => `• ${m.item}`).join('\n')}\n\nA claim will be filed for these. Continue?`
    )) return;
    setSaving(true);
    try {
      // File a claim for every unticked item BEFORE closing the move
      if (missing.length > 0) {
        await reportMovingIssue(
          request.id, userId, 'missing_item',
          `Items not received at delivery sign-off: ${missing.map(m => `${m.item} (×${m.qty})`).join(', ')}`
        );
      }
      await signOffDelivery(request.id, checks, signature.trim());
      onSigned();
    } catch (err) {
      console.error(err);
      alert('Could not complete sign-off. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Card style={{ marginBottom: 14, background: 'rgba(159,122,234,0.10)', border: '1px solid rgba(159,122,234,0.40)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>📦</div>
          <div>
            <div style={{ color: '#9F7AEA', fontSize: 16, fontWeight: 800 }}>Your items have arrived</div>
            <div style={{ color: C.textSec, fontSize: 13, marginTop: 2 }}>
              Check everything before the crew leaves, then sign below.
            </div>
          </div>
        </div>
      </Card>

      {/* Mover's delivery photos */}
      {Array.isArray(request.delivery_photo_urls) && request.delivery_photo_urls.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📸 DELIVERY PHOTOS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
            {request.delivery_photo_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`delivery ${i+1}`}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Inventory checklist */}
      {checks.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>✅ Check your inventory</div>
          <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12 }}>
            Untick anything missing or damaged — a claim is filed automatically.
          </div>
          {checks.map((c, i) => (
            <div key={i} onClick={() => toggle(i)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', marginBottom: 6, borderRadius: 10, cursor: 'pointer',
              background: c.received ? 'rgba(72,187,120,0.08)' : 'rgba(252,129,129,0.10)',
              border: `1px solid ${c.received ? 'rgba(72,187,120,0.35)' : 'rgba(252,129,129,0.45)'}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${c.received ? C.success : C.error}`,
                background: c.received ? C.success : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 800,
              }}>{c.received ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <span style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>{c.item}</span>
                {c.qty > 1 && <span style={{ color: C.textMuted, fontSize: 12 }}> × {c.qty}</span>}
              </div>
              {!c.received && (
                <span style={{ color: C.error, fontSize: 10, fontWeight: 800 }}>MISSING / DAMAGED</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Digital signature */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>✍️ Digital Sign-off</div>
        <div style={{ color: C.textSec, fontSize: 12, marginBottom: 10 }}>
          Type your full name to confirm delivery{missing.length > 0 ? ` (${missing.length} item(s) flagged for claim)` : ''}.
        </div>
        <input value={signature} onChange={e => setSignature(e.target.value)}
          placeholder="Your full name"
          style={{
            width: '100%', background: C.navy, border: `1px solid ${C.navyBorder}`,
            borderRadius: 10, padding: '13px 15px', color: C.textPrimary,
            fontSize: 15, boxSizing: 'border-box', fontStyle: 'italic',
          }} />
        <Btn onClick={handleSign} disabled={saving || !signature.trim()}
          style={{ width: '100%', marginTop: 12, opacity: (!signature.trim() || saving) ? 0.5 : 1 }}>
          {saving ? 'Confirming…' : '✓ Confirm Delivery & Sign'}
        </Btn>
      </Card>

      <MovingSupportSection
        requestId={request.id}
        moverPhone={request.mover_phone}
        moverCompany={request.mover_company_name}
      />
    </>
  );
}

// ─── Crew Member Card (with Supervisor / Team Leader highlight) ───
function CrewMemberCard({ worker }) {
  const meta = ROLE_META[worker.role] || { label: worker.role || 'Crew', icon: '👤', color: C.textSec };
  const isLead = worker.role === 'team_leader';
  return (
    <Card style={{
      background: isLead ? `${C.gold}10` : C.navyLight,
      border: `1px solid ${isLead ? C.gold + '50' : C.navyBorder}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Photo */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: worker.photo_url ? 'transparent' : C.navy,
          border: `2px solid ${isLead ? C.gold : meta.color + '60'}`,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>
          {worker.photo_url
            ? <img src={worker.photo_url} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700 }}>{worker.name}</span>
            {isLead && (
              <span style={{
                background: C.gold, color: '#0A0E1A', fontSize: 9, fontWeight: 800,
                padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5,
              }}>⭐ SUPERVISOR</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{meta.icon}</span>
            <span style={{ color: meta.color, fontSize: 12, fontWeight: 600 }}>{meta.label}</span>
          </div>
        </div>

        {/* Call worker */}
        {worker.phone && (
          <a href={`tel:${worker.phone}`} style={{ textDecoration: 'none' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${C.info}20`, border: `1px solid ${C.info}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, cursor: 'pointer',
            }}>📞</div>
          </a>
        )}
      </div>
    </Card>
  );
}
