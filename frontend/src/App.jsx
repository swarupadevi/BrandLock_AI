
import { useEffect, useState } from 'react';
import './App.css';

const API = import.meta.env.VITE_API_URL ?? '';

function App() {
  const [registerMode, setRegisterMode] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [brands, setBrands] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [brandForm, setBrandForm] = useState({
    brand_name: '',
    website: '',
    social_url: '',
    app_url: '',
    logo_url: '',
  });

  const [selectedBrand, setSelectedBrand] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  const loadBrands = async () => {
    try {
      const response = await fetch(`${API}/api/brands`);
      const data = await response.json();
      if (response.ok) setBrands(data.brands || []);
    } catch {
      setError('Could not load brands. Check the backend server.');
    }
  };

  useEffect(() => {
    if (loggedIn) loadBrands();
  }, [loggedIn]);

  const requestAccount = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (registerMode && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = registerMode ? '/api/register' : '/api/login';

      const body = registerMode
        ? {
            full_name: fullName.trim(),
            email: email.trim(),
            organization_name: organization.trim(),
            password,
          }
        : { email: email.trim(), password };

      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Something went wrong. Please try again.');
        return;
      }

      if (registerMode) {
        setRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
        setMessage('Account created! Please sign in.');
      } else {
        setLoggedIn(true);
        setPage('Dashboard');
        setMessage('');
        setPassword('');
      }
    } catch {
      setError('Cannot connect to backend. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  const saveBrand = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Could not save brand.');
        return;
      }

      setMessage('Brand profile saved successfully!');
      setBrandForm({
        brand_name: '',
        website: '',
        social_url: '',
        app_url: '',
        logo_url: '',
      });
      await loadBrands();
    } catch {
      setError('Cannot connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const checkSocial = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setCheckResult(null);

    if (!selectedBrand) {
      setError('Please select a brand first.');
      return;
    }

    try {
      const params = new URLSearchParams({
        profile_url: socialUrl.trim(),
        brand_name: selectedBrand,
      });

      const response = await fetch(
        `${API}/api/check-profile?${params.toString()}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Profile check failed.');
        return;
      }

      setCheckResult(data);
      setAlerts((previous) => [
        {
          id: Date.now(),
          brand: selectedBrand,
          url: socialUrl.trim(),
          status: data.status,
          message: data.message,
          type: 'Social profile',
        },
        ...previous,
      ]);
    } catch {
      setError('Cannot connect to backend.');
    }
  };

  const checkApp = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setCheckResult(null);

    if (!selectedBrand) {
      setError('Please select a brand first.');
      return;
    }

    const brand = brands.find((item) => item.brand_name === selectedBrand);

    if (!brand || !brand.app_url) {
      const result = {
        status: 'unknown',
        message: 'No official app URL is registered for this brand.',
      };
      setCheckResult(result);
      addAppAlert(result);
      return;
    }

    const normalize = (url) => url.trim().replace(/\/+$/, '');
    const matched = normalize(appUrl) === normalize(brand.app_url);

    const result = matched
      ? {
          status: 'matched',
          message: 'App URL matches the registered official app URL.',
        }
      : {
          status: 'review_needed',
          message: 'App URL differs from the registered official URL. Review it carefully.',
        };

    setCheckResult(result);
    addAppAlert(result);
  };

  const addAppAlert = (result) => {
    setAlerts((previous) => [
      {
        id: Date.now(),
        brand: selectedBrand,
        url: appUrl.trim(),
        status: result.status,
        message: result.message,
        type: 'App URL',
      },
      ...previous,
    ]);
  };

  const logout = () => {
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setRegisterMode(false);
  };

  const navigation = [
    { name: 'Dashboard', icon: '▦' },
    { name: 'Brand Profile', icon: '◈' },
    { name: 'Social Monitoring', icon: '◎' },
    { name: 'App Monitoring', icon: '▣' },
    { name: 'Alerts', icon: '♧' },
  ];

  if (!loggedIn) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={requestAccount}>
          <div className="brand-mark">B</div>
          <p className="eyebrow">DIGITAL BRAND SECURITY</p>
          <h1>BrandLock<span>AI</span></h1>
          <p className="muted">
            Protect your brand from fake profiles and impersonation.
          </p>
          <h2>{registerMode ? 'Create your account' : 'Welcome back'}</h2>

          {registerMode && (
            <>
              <label>Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                required
              />
              <label>Organization Name</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Your organization"
                maxLength={150}
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={128}
            required
          />

          {registerMode && (
            <>
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                minLength={8}
                maxLength={128}
                required
              />
            </>
          )}

          {error && <p className="notice error">{error}</p>}
          {message && <p className="notice success">{message}</p>}

          <button className="primary-button full-button" disabled={loading}>
            {loading
              ? 'Please wait...'
              : registerMode
                ? 'Create Account'
                : 'Sign In'}
          </button>

          <p className="switch-auth">
            {registerMode ? 'Already registered?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setRegisterMode(!registerMode);
                setError('');
                setMessage('');
              }}
            >
              {registerMode ? ' Sign In' : ' Create Account'}
            </button>
          </p>
          <p className="auth-footer">BrandLockAI · Brand Protection Platform</p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-mark small-mark">B</div>
          <div>
            <strong>BrandLock<span>AI</span></strong>
            <small>BRAND PROTECTION</small>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${page === item.name ? 'active' : ''}`}
              onClick={() => {
                setPage(item.name);
                setError('');
                setMessage('');
                setCheckResult(null);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === 'Alerts' && alerts.length > 0 && (
                <span className="nav-count">{alerts.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-note">
            <span>●</span> Protection workspace
            <small>Brand monitoring prototype</small>
          </div>
          <button className="logout-button" onClick={logout}>↪ Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">BRANDLOCKAI WORKSPACE</p>
            <h1>{page}</h1>
          </div>
          <div className="user-pill">
            <div className="avatar">{email.charAt(0).toUpperCase()}</div>
            <div>
              <strong>Account</strong>
              <small>{email}</small>
            </div>
          </div>
        </header>

        {error && <p className="notice error">{error}</p>}
        {message && <p className="notice success">{message}</p>}

        {page === 'Dashboard' && (
          <>
            <section className="welcome-banner">
              <div>
                <p className="banner-label">YOUR SECURITY OVERVIEW</p>
                <h2>Welcome to BrandLockAI 👋</h2>
                <p>Keep your official brand information organized and review suspicious URLs.</p>
              </div>
              <div className="shield-art">◇</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon blue">◈</span>
                <p>Registered Brands</p>
                <h2>{brands.length}</h2>
                <small>Saved in your database</small>
              </div>
              <div className="stat-card">
                <span className="stat-icon cyan">◎</span>
                <p>URLs Checked</p>
                <h2>{alerts.length}</h2>
                <small>Checks in this session</small>
              </div>
              <div className="stat-card">
                <span className="stat-icon orange">⚑</span>
                <p>Needs Review</p>
                <h2>{alerts.filter((a) => a.status === 'review_needed').length}</h2>
                <small>URL differences found</small>
              </div>
            </section>

            <section className="section-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Choose what you want to do next.</p>
              </div>
            </section>

            <section className="quick-grid">
              <button className="quick-card" onClick={() => setPage('Brand Profile')}>
                <span className="quick-icon">＋</span>
                <h3>Register a Brand</h3>
                <p>Add your company's official website and profile URLs.</p>
                <span className="text-link">Add brand →</span>
              </button>
              <button className="quick-card" onClick={() => setPage('Social Monitoring')}>
                <span className="quick-icon">◎</span>
                <h3>Check Social Profile</h3>
                <p>Compare a submitted profile URL with your registered URL.</p>
                <span className="text-link">Check URL →</span>
              </button>
              <button className="quick-card" onClick={() => setPage('App Monitoring')}>
                <span className="quick-icon">▣</span>
                <h3>Check App URL</h3>
                <p>Compare an app link with the official URL you saved.</p>
                <span className="text-link">Check app →</span>
              </button>
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Registered Brands</h2>
                  <p>Official brand records from your database.</p>
                </div>
                <button className="secondary-button" onClick={() => setPage('Brand Profile')}>
                  + Add Brand
                </button>
              </div>
              {brands.length === 0 ? (
                <p className="empty-state">No brands saved yet. Select “Register a Brand” to get started.</p>
              ) : (
                <div className="brand-list">
                  {brands.map((brand) => (
                    <div className="brand-row" key={brand.id}>
                      <div className="brand-avatar">{brand.brand_name.charAt(0).toUpperCase()}</div>
                      <div className="brand-details">
                        <strong>{brand.brand_name}</strong>
                        <small>{brand.website || 'No website provided'}</small>
                      </div>
                      <span className="status-chip">Registered</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {page === 'Brand Profile' && (
          <section className="panel form-panel">
            <div className="section-heading">
              <div>
                <h2>Official Brand Profile</h2>
                <p>Save the trusted information you will use for URL comparisons.</p>
              </div>
              <span className="section-symbol">◈</span>
            </div>

            <form onSubmit={saveBrand} className="data-form">
              <label>Company / Brand Name *</label>
              <input
                value={brandForm.brand_name}
                onChange={(e) => setBrandForm({ ...brandForm, brand_name: e.target.value })}
                placeholder="e.g. Example Company"
                maxLength={150}
                required
              />

              <label>Official Website</label>
              <input
                type="url"
                value={brandForm.website}
                onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                placeholder="https://example.com"
              />

              <label>Official Social Profile URL</label>
              <input
                type="url"
                value={brandForm.social_url}
                onChange={(e) => setBrandForm({ ...brandForm, social_url: e.target.value })}
                placeholder="https://instagram.com/yourbrand"
              />

              <label>Official App URL</label>
              <input
                type="url"
                value={brandForm.app_url}
                onChange={(e) => setBrandForm({ ...brandForm, app_url: e.target.value })}
                placeholder="https://example.com/app"
              />

              <label>Logo URL (optional)</label>
              <input
                type="url"
                value={brandForm.logo_url}
                onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />

              <button className="primary-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Brand Profile'}
              </button>
            </form>

            <h3 className="subheading">Saved Brands ({brands.length})</h3>
            {brands.map((brand) => (
              <div className="brand-row" key={brand.id}>
                <div className="brand-avatar">{brand.brand_name.charAt(0).toUpperCase()}</div>
                <div className="brand-details">
                  <strong>{brand.brand_name}</strong>
                  <small>{brand.website || 'No website provided'}</small>
                </div>
                <span className="status-chip">Saved</span>
              </div>
            ))}
          </section>
        )}

        {(page === 'Social Monitoring' || page === 'App Monitoring') && (
          <section className="panel form-panel">
            <div className="section-heading">
              <div>
                <h2>{page === 'Social Monitoring' ? 'Social Profile Check' : 'App URL Check'}</h2>
                <p>
                  Compare a submitted URL against the official URL registered for a brand.
                </p>
              </div>
              <span className="section-symbol">{page === 'Social Monitoring' ? '◎' : '▣'}</span>
            </div>

            {brands.length === 0 ? (
              <div className="empty-state">
                Register a brand first. Then return here to check a URL.
                <p><button className="secondary-button" onClick={() => setPage('Brand Profile')}>Register a Brand</button></p>
              </div>
            ) : (
              <form
                className="data-form"
                onSubmit={page === 'Social Monitoring' ? checkSocial : checkApp}
              >
                <label>Select Brand *</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  required
                >
                  <option value="">Choose a registered brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.brand_name}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>

                <label>{page === 'Social Monitoring' ? 'Submitted Social Profile URL *' : 'Submitted App URL *'}</label>
                <input
                  type="url"
                  value={page === 'Social Monitoring' ? socialUrl : appUrl}
                  onChange={(e) => {
                    if (page === 'Social Monitoring') setSocialUrl(e.target.value);
                    else setAppUrl(e.target.value);
                  }}
                  placeholder="https://..."
                  required
                />

                <button className="primary-button">Check URL</button>
              </form>
            )}

            {checkResult && (
              <div className={`result-card ${checkResult.status}`}>
                <span className="result-symbol">
                  {checkResult.status === 'matched' ? '✓' : checkResult.status === 'unknown' ? '?' : '!'}
                </span>
                <div>
                  <strong>
                    {checkResult.status === 'matched'
                      ? 'Matched'
                      : checkResult.status === 'unknown'
                        ? 'Unknown'
                        : 'Review Needed'}
                  </strong>
                  <p>{checkResult.message}</p>
                </div>
              </div>
            )}

            <p className="disclaimer">
              Note: This prototype compares URLs with the official URL you registered. It does not independently scan social networks or app stores.
            </p>
          </section>
        )}

        {page === 'Alerts' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>URL Check Results</h2>
                <p>Results recorded during this browser session.</p>
              </div>
              <span className="section-symbol">♧</span>
            </div>

            {alerts.length === 0 ? (
              <p className="empty-state">No checks yet. Run a social profile or app URL check to see results here.</p>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div className="alert-row" key={alert.id}>
                    <span className={`alert-dot ${alert.status}`} />
                    <div className="alert-main">
                      <strong>{alert.brand} · {alert.type}</strong>
                      <p>{alert.url}</p>
                      <small>{alert.message}</small>
                    </div>
                    <span className={`result-badge ${alert.status}`}>
                      {alert.status === 'matched'
                        ? 'Matched'
                        : alert.status === 'unknown'
                          ? 'Unknown'
                          : 'Review Needed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="main-footer">
          <span>BrandLockAI</span> · Digital Brand Protection Prototype
        </footer>
      </main>
    </div>
  );
}

export default App;