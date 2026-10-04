import { useEffect, useMemo, useState } from 'react'

import {

  LayoutDashboard,

  Users,

  Droplets,

  Activity,

  Wifi,

  Gauge,

  Plus,

  Search,

  Pencil,

  Trash2,

  X,

  RefreshCw,

  UserPlus,

  CircleDollarSign

 } from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

import { supabase } from './supabaseClient'

import './App.css'



function App() {

  const [page, setPage] = useState('dashboard')



  const [users, setUsers] = useState([])

  const [allocations, setAllocations] = useState([])

  const [transactions, setTransactions] = useState([])

  const [devices, setDevices] = useState([])
  const [waterPrice, setWaterPrice] = useState(0.10)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')



  const [userModalOpen, setUserModalOpen] = useState(false)

  const [editingUser, setEditingUser] = useState(null)



  const [allocationModalOpen, setAllocationModalOpen] = useState(false)

  const [editingAllocation, setEditingAllocation] = useState(null)



  useEffect(() => {

    loadData()

  }, [])



  async function loadData() {

    setLoading(true)

    setError('')



    try {

      const [

        usersResult,

        allocationsResult,

        transactionsResult,

        devicesResult,

        settingsResult

      ] = await Promise.all([

        supabase

          .from('users')

          .select('*')

          .order('created_at', { ascending: false }),



        supabase

          .from('allocations')

          .select(`

            *,

            users (

              id,

              full_name,

              phone_number,

              fingerprint_id

            )

          `)

          .order('created_at', { ascending: false }),



        supabase

          .from('water_transactions')

          .select(`

            *,

            users (

              full_name

            )

          `)

          .order('created_at', { ascending: false }),



        supabase

          .from('devices')

          .select('*')

          .order('created_at', { ascending: false }),

        supabase
          .from('water_settings')
          .select('price_per_litre, currency')
          .eq('id', 1)
          .maybeSingle()

      ])



      if (usersResult.error) throw usersResult.error

      if (allocationsResult.error) throw allocationsResult.error

      if (transactionsResult.error) throw transactionsResult.error

      if (devicesResult.error) throw devicesResult.error

      if (!settingsResult.error && settingsResult.data?.price_per_litre != null) {
        setWaterPrice(Number(settingsResult.data.price_per_litre))
      } else {
        setWaterPrice(0.10)
      }



      setUsers(usersResult.data || [])

      setAllocations(allocationsResult.data || [])

      setTransactions(transactionsResult.data || [])

      setDevices(devicesResult.data || [])

    } catch (err) {

      console.error(err)

      setError(err.message || 'Failed to load dashboard data.')

    } finally {

      setLoading(false)

    }

  }



  const totalAllocated = allocations.reduce(

    (sum, item) => sum + Number(item.allocated_litres || 0),

    0

  )



  const totalUsed = allocations.reduce(

    (sum, item) => sum + Number(item.used_litres || 0),

    0

  )



  const totalRemaining = allocations.reduce(

    (sum, item) => sum + Number(item.remaining_litres || 0),

    0

  )


  const successfulTransactions = transactions.filter(
    (transaction) => transaction.status === 'successful'
  )

  const totalTransactionVolume = successfulTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.volume_litres || 0),
    0
  )

  const totalRevenue = successfulTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction, waterPrice),
    0
  )

  const averageTransactionValue =
    successfulTransactions.length > 0
      ? totalRevenue / successfulTransactions.length
      : 0



  async function deleteUser(id) {

    const confirmed = window.confirm(

      'Are you sure you want to delete this user?'

    )



    if (!confirmed) return



    const { error } = await supabase

      .from('users')

      .delete()

      .eq('id', id)



    if (error) {

      alert(`Unable to delete user: ${error.message}`)

      return

    }



    await loadData()

  }



  async function deleteAllocation(id) {

    const confirmed = window.confirm(

      'Are you sure you want to delete this allocation?'

    )



    if (!confirmed) return



    const { error } = await supabase

      .from('allocations')

      .delete()

      .eq('id', id)



    if (error) {

      alert(`Unable to delete allocation: ${error.message}`)

      return

    }



    await loadData()

  }



  return (

    <div className="app">



      {/* SIDEBAR */}

      <aside className="sidebar">



        <div className="logo">

          <Droplets size={30} />

          <span>SmartWater</span>

        </div>



        <nav>



          <a

            className={page === 'dashboard' ? 'active' : ''}

            onClick={() => setPage('dashboard')}

          >

            <LayoutDashboard size={18} />

            <span>Dashboard</span>

          </a>



          <a

            className={page === 'users' ? 'active' : ''}

            onClick={() => setPage('users')}

          >

            <Users size={18} />

            <span>Users</span>

          </a>



          <a

            className={page === 'allocations' ? 'active' : ''}

            onClick={() => setPage('allocations')}

          >

            <Droplets size={18} />

            <span>Allocations</span>

          </a>



          <a

            className={page === 'transactions' ? 'active' : ''}

            onClick={() => setPage('transactions')}

          >

            <Activity size={18} />

            <span>Transactions</span>

          </a>



          <a

            className={page === 'devices' ? 'active' : ''}

            onClick={() => setPage('devices')}

          >

            <Wifi size={18} />

            <span>Devices</span>

          </a>



          <a

            className={page === 'analytics' ? 'active' : ''}

            onClick={() => setPage('analytics')}

          >

            <Gauge size={18} />

            <span>Analytics</span>

          </a>



        </nav>



      </aside>



      {/* MAIN */}

      <main className="main">



        {error && (

          <div className="error-banner">

            {error}

          </div>

        )}



        {page === 'dashboard' && (

          <DashboardPage

            users={users}

            allocations={allocations}

            transactions={transactions}

            devices={devices}

            totalAllocated={totalAllocated}

            totalUsed={totalUsed}

            totalRemaining={totalRemaining}
            waterPrice={waterPrice}
            totalTransactionVolume={totalTransactionVolume}
            totalRevenue={totalRevenue}
            averageTransactionValue={averageTransactionValue}

            loading={loading}

            onRefresh={loadData}

          />

        )}



        {page === 'users' && (

          <UsersPage

            users={users}

            loading={loading}

            onAdd={() => {

              setEditingUser(null)

              setUserModalOpen(true)

            }}

            onEdit={(user) => {

              setEditingUser(user)

              setUserModalOpen(true)

            }}

            onDelete={deleteUser}

            onRefresh={loadData}

          />

        )}



        {page === 'allocations' && (

          <AllocationsPage

            allocations={allocations}

            users={users}

            loading={loading}

            onAdd={() => {

              setEditingAllocation(null)

              setAllocationModalOpen(true)

            }}

            onEdit={(allocation) => {

              setEditingAllocation(allocation)

              setAllocationModalOpen(true)

            }}

            onDelete={deleteAllocation}

            onRefresh={loadData}

          />

        )}



        {page === 'transactions' && (

          <TransactionsPage

            transactions={transactions}
            waterPrice={waterPrice}

            loading={loading}

            onRefresh={loadData}

          />

        )}



        {page === 'devices' && (

          <DevicesPage

            devices={devices}

            loading={loading}

            onRefresh={loadData}

          />

        )}



        {page === 'analytics' && (

          <AnalyticsPage

            allocations={allocations}

            transactions={transactions}

            users={users}
            waterPrice={waterPrice}

          />

        )}



      </main>



      {/* USER MODAL */}

      {userModalOpen && (

        <UserModal

          user={editingUser}

          onClose={() => {

            setUserModalOpen(false)

            setEditingUser(null)

          }}

          onSaved={loadData}

        />

      )}



      {/* ALLOCATION MODAL */}

      {allocationModalOpen && (

        <AllocationModal

          allocation={editingAllocation}

          users={users}

          onClose={() => {

            setAllocationModalOpen(false)

            setEditingAllocation(null)

          }}

          onSaved={loadData}

        />

      )}



    </div>

  )

}





/* =========================================================

   DASHBOARD

========================================================= */



function DashboardPage({
  users,
  allocations,
  transactions,
  devices,
  totalAllocated,
  totalUsed,
  totalRemaining,
  waterPrice,
  totalTransactionVolume,
  totalRevenue,
  averageTransactionValue,
  loading,
  onRefresh
}) {
  const successfulTransactions = transactions.filter(
    (transaction) => transaction.status === 'successful'
  )

  const failedTransactions = transactions.filter(
    (transaction) => transaction.status === 'failed'
  )

  const userRevenue = users
    .map((user) => {
      const userTransactions = successfulTransactions.filter(
        (transaction) => transaction.user_id === user.id
      )

      const volume = userTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.volume_litres || 0),
        0
      )

      const revenue = userTransactions.reduce(
        (sum, transaction) =>
          sum + getTransactionAmount(transaction, waterPrice),
        0
      )

      return {
        name: user.full_name || 'Unknown',
        volume,
        revenue
      }
    })
    .filter((item) => item.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Smart Water Allocation Management System"
        onRefresh={onRefresh}
        loading={loading}
      />

      <div className="stats-grid">
        <StatCard icon={<Users size={22} />} title="Registered Users" value={users.length} />
        <StatCard icon={<Droplets size={22} />} title="Allocated Water" value={`${totalAllocated.toFixed(2)} L`} />
        <StatCard icon={<Activity size={22} />} title="Water Dispensed" value={`${totalTransactionVolume.toFixed(2)} L`} />
        <StatCard icon={<Droplets size={22} />} title="Water Remaining" value={`${totalRemaining.toFixed(2)} L`} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Water Price" value={`$${waterPrice.toFixed(2)} / L`} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Water Consumption</h2>
              <p>Current allocation usage</p>
            </div>
          </div>

          <div className="consumption-list">
            {allocations.length === 0 ? (
              <EmptyState text="No allocations found." />
            ) : (
              allocations.slice(0, 8).map((allocation) => {
                const allocated = Number(allocation.allocated_litres || 0)
                const used = Number(allocation.used_litres || 0)
                const percentage =
                  allocated > 0
                    ? Math.min((used / allocated) * 100, 100)
                    : 0

                return (
                  <div className="consumption-item" key={allocation.id}>
                    <div className="consumption-top">
                      <strong>{allocation.users?.full_name || 'Unknown User'}</strong>
                      <span>{used.toFixed(2)} / {allocated.toFixed(2)} L</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Sales Summary</h2>
              <p>Automatic transaction pricing</p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-box"><span>Price per litre</span><strong>${waterPrice.toFixed(2)}</strong></div>
            <div className="analytics-box"><span>Successful transactions</span><strong>{successfulTransactions.length}</strong></div>
            <div className="analytics-box"><span>Failed transactions</span><strong>{failedTransactions.length}</strong></div>
            <div className="analytics-box"><span>Average transaction</span><strong>${averageTransactionValue.toFixed(2)}</strong></div>
            <div className="analytics-box"><span>Total allocated</span><strong>{totalAllocated.toFixed(2)} L</strong></div>
            <div className="analytics-box"><span>Total used from allocations</span><strong>{totalUsed.toFixed(2)} L</strong></div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Usage by User</h2>
              <p>Successful water collection</p>
            </div>
          </div>

          {userRevenue.length === 0 ? (
            <EmptyState text="No successful transactions yet." />
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" name="Litres" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Devices</h2>
              <p>Water station status</p>
            </div>
          </div>

          {devices.length === 0 ? (
            <EmptyState text="No devices registered." />
          ) : (
            <div className="device-list">
              {devices.map((device) => (
                <div className="device-row" key={device.id}>
                  <div>
                    <strong>{device.device_name}</strong>
                    <small>{device.location || 'No location'}</small>
                  </div>
                  <span className={`status ${device.status || 'offline'}`}>
                    {device.status || 'offline'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Latest water dispensing activity and automatic pricing</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyState text="No transactions found." />
        ) : (
          <TransactionTable transactions={transactions.slice(0, 10)} waterPrice={waterPrice} />
        )}
      </section>
    </div>
  )
}


/* =========================================================

   USERS PAGE

========================================================= */



function UsersPage({

  users,

  loading,

  onAdd,

  onEdit,

  onDelete,

  onRefresh

}) {

  const [search, setSearch] = useState('')



  const filteredUsers = useMemo(() => {



    const term = search.toLowerCase().trim()



    if (!term) return users



    return users.filter((user) =>

      String(user.full_name || '')

        .toLowerCase()

        .includes(term) ||



      String(user.phone_number || '')

        .toLowerCase()

        .includes(term) ||



      String(user.fingerprint_id || '')

        .includes(term)

    )



  }, [users, search])



  return (

    <div>



      <PageHeader

        title="Users"

        subtitle="Manage registered water users"

        onRefresh={onRefresh}

        loading={loading}

      />



      <div className="page-actions">



        <div className="search-box">

          <Search size={18} />



          <input

            type="text"

            placeholder="Search users..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </div>



        <button

          className="primary-btn"

          onClick={onAdd}

        >

          <Plus size={18} />

          Add User

        </button>



      </div>



      <section className="card">



        {loading ? (

          <LoadingState />

        ) : filteredUsers.length === 0 ? (

          <EmptyState text="No users found." />

        ) : (



          <div className="table-wrapper">



            <table>



              <thead>

                <tr>

                  <th>Name</th>

                  <th>Phone</th>

                  <th>Fingerprint ID</th>

                  <th>Status</th>

                  <th>Registered</th>

                  <th>Actions</th>

                </tr>

              </thead>



              <tbody>



                {filteredUsers.map((user) => (



                  <tr key={user.id}>



                    <td>

                      <div className="user-name">

                        <div className="avatar">

                          {user.full_name

                            ?.charAt(0)

                            ?.toUpperCase()}

                        </div>



                        <strong>

                          {user.full_name}

                        </strong>

                      </div>

                    </td>



                    <td>

                      {user.phone_number || '-'}

                    </td>



                    <td>

                      {user.fingerprint_id ?? '-'}

                    </td>



                    <td>

                      <span

                        className={`status ${user.status}`}

                      >

                        {user.status}

                      </span>

                    </td>



                    <td>

                      {formatDate(user.created_at)}

                    </td>



                    <td>



                      <div className="action-buttons">



                        <button

                          className="icon-btn"

                          title="Edit"

                          onClick={() => onEdit(user)}

                        >

                          <Pencil size={16} />

                        </button>



                        <button

                          className="icon-btn danger"

                          title="Delete"

                          onClick={() => onDelete(user.id)}

                        >

                          <Trash2 size={16} />

                        </button>



                      </div>



                    </td>



                  </tr>



                ))}



              </tbody>



            </table>



          </div>



        )}



      </section>



    </div>

  )

}





/* =========================================================

   ALLOCATIONS PAGE

========================================================= */



function AllocationsPage({

  allocations,

  loading,

  onAdd,

  onEdit,

  onDelete,

  onRefresh

}) {

  const [search, setSearch] = useState('')



  const filteredAllocations = useMemo(() => {



    const term = search.toLowerCase().trim()



    if (!term) return allocations



    return allocations.filter((allocation) => {



      const name =

        allocation.users?.full_name || ''



      const phone =

        allocation.users?.phone_number || ''



      return (

        name.toLowerCase().includes(term) ||

        phone.toLowerCase().includes(term)

      )

    })



  }, [allocations, search])



  return (

    <div>



      <PageHeader

        title="Allocations"

        subtitle="Manage water allocations for registered users"

        onRefresh={onRefresh}

        loading={loading}

      />



      <div className="page-actions">



        <div className="search-box">

          <Search size={18} />



          <input

            type="text"

            placeholder="Search allocations..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </div>



        <button

          className="primary-btn"

          onClick={onAdd}

        >

          <Plus size={18} />

          Add Allocation

        </button>



      </div>



      <section className="card">



        {loading ? (

          <LoadingState />

        ) : filteredAllocations.length === 0 ? (

          <EmptyState text="No allocations found." />

        ) : (



          <div className="table-wrapper">



            <table>



              <thead>



                <tr>

                  <th>User</th>

                  <th>Allocated</th>

                  <th>Used</th>

                  <th>Remaining</th>

                  <th>Allocation Date</th>

                  <th>Expiry</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>



              </thead>



              <tbody>



                {filteredAllocations.map((allocation) => (



                  <tr key={allocation.id}>



                    <td>

                      <div className="user-name">



                        <div className="avatar">

                          {allocation.users?.full_name

                            ?.charAt(0)

                            ?.toUpperCase() || '?'}

                        </div>



                        <div>

                          <strong>

                            {allocation.users?.full_name ||

                              'Unknown User'}

                          </strong>



                          <small>

                            {allocation.users?.phone_number || ''}

                          </small>

                        </div>



                      </div>

                    </td>



                    <td>

                      <strong>

                        {Number(

                          allocation.allocated_litres || 0

                        ).toFixed(2)} L

                      </strong>

                    </td>



                    <td>

                      {Number(

                        allocation.used_litres || 0

                      ).toFixed(2)} L

                    </td>



                    <td>

                      <strong className="remaining-value">

                        {Number(

                          allocation.remaining_litres || 0

                        ).toFixed(2)} L

                      </strong>

                    </td>



                    <td>

                      {formatDate(allocation.allocation_date)}

                    </td>



                    <td>

                      {allocation.expiry_date

                        ? formatDate(allocation.expiry_date)

                        : 'No expiry'}

                    </td>



                    <td>

                      <span

                        className={`status ${

                          allocation.status || 'active'

                        }`}

                      >

                        {allocation.status || 'active'}

                      </span>

                    </td>



                    <td>



                      <div className="action-buttons">



                        <button

                          className="icon-btn"

                          title="Edit allocation"

                          onClick={() => onEdit(allocation)}

                        >

                          <Pencil size={16} />

                        </button>



                        <button

                          className="icon-btn danger"

                          title="Delete allocation"

                          onClick={() => onDelete(allocation.id)}

                        >

                          <Trash2 size={16} />

                        </button>



                      </div>



                    </td>



                  </tr>



                ))}



              </tbody>



            </table>



          </div>



        )}



      </section>



    </div>

  )

}





/* =========================================================

   USER MODAL

========================================================= */



function UserModal({

  user,

  onClose,

  onSaved

}) {

  const [form, setForm] = useState({

    full_name: user?.full_name || '',

    phone_number: user?.phone_number || '',

    fingerprint_id:

      user?.fingerprint_id?.toString() || '',

    status: user?.status || 'active'

  })



  const [saving, setSaving] = useState(false)



  function updateField(field, value) {

    setForm((previous) => ({

      ...previous,

      [field]: value

    }))

  }



  async function handleSubmit(e) {

    e.preventDefault()



    if (!form.full_name.trim()) {

      alert("Please enter the user's full name.")

      return

    }



    if (!form.fingerprint_id) {

      alert('Please enter a fingerprint ID.')

      return

    }



    const fingerprintId = Number(form.fingerprint_id)



    if (

      !Number.isInteger(fingerprintId) ||

      fingerprintId <= 0

    ) {

      alert('Fingerprint ID must be a positive whole number.')

      return

    }



    setSaving(true)



    try {



      const payload = {

        full_name: form.full_name.trim(),

        phone_number: form.phone_number.trim() || null,

        fingerprint_id: fingerprintId,

        status: form.status

      }



      let result



      if (user) {



        result = await supabase

          .from('users')

          .update(payload)

          .eq('id', user.id)



      } else {



        result = await supabase

          .from('users')

          .insert([payload])



      }



      if (result.error) {



        if (result.error.code === '23505') {

          throw new Error(

            'That fingerprint ID is already registered.'

          )

        }



        throw result.error

      }



      await onSaved()

      onClose()



    } catch (err) {



      console.error(err)

      alert(err.message || 'Failed to save user.')



    } finally {

      setSaving(false)

    }

  }



  return (

    <div className="modal-overlay">



      <div className="modal">



        <div className="modal-header">



          <div>

            <h2>

              {user ? 'Edit User' : 'Add User'}

            </h2>



            <p>

              {user

                ? 'Update user information'

                : 'Register a new water user'}

            </p>

          </div>



          <button

            className="close-btn"

            onClick={onClose}

          >

            <X size={20} />

          </button>



        </div>



        <form onSubmit={handleSubmit}>



          <div className="form-group">



            <label>Full Name</label>



            <input

              type="text"

              value={form.full_name}

              onChange={(e) =>

                updateField('full_name', e.target.value)

              }

              placeholder="Enter full name"

            />



          </div>



          <div className="form-group">



            <label>Phone Number</label>



            <input

              type="text"

              value={form.phone_number}

              onChange={(e) =>

                updateField(

                  'phone_number',

                  e.target.value

                )

              }

              placeholder="+263..."

            />



          </div>



          <div className="form-group">



            <label>Fingerprint ID</label>



            <input

              type="number"

              min="1"

              value={form.fingerprint_id}

              onChange={(e) =>

                updateField(

                  'fingerprint_id',

                  e.target.value

                )

              }

              placeholder="Example: 4"

            />



            <small>

              This is the fingerprint slot number stored in

              the fingerprint sensor.

            </small>



          </div>



          <div className="form-group">



            <label>Status</label>



            <select

              value={form.status}

              onChange={(e) =>

                updateField('status', e.target.value)

              }

            >

              <option value="active">Active</option>

              <option value="blocked">Blocked</option>

              <option value="inactive">Inactive</option>

            </select>



          </div>



          <div className="modal-actions">



            <button

              type="button"

              className="secondary-btn"

              onClick={onClose}

            >

              Cancel

            </button>



            <button

              type="submit"

              className="primary-btn"

              disabled={saving}

            >

              {saving

                ? 'Saving...'

                : user

                  ? 'Update User'

                  : 'Add User'}

            </button>



          </div>



        </form>



      </div>



    </div>

  )

}





/* =========================================================

   ALLOCATION MODAL

========================================================= */



function AllocationModal({

  allocation,

  users,

  onClose,

  onSaved

}) {

  const [form, setForm] = useState({

    user_id: allocation?.user_id || '',

    allocated_litres:

      allocation?.allocated_litres?.toString() || '',

    used_litres:

      allocation?.used_litres?.toString() || '0',

    expiry_date:

      allocation?.expiry_date

        ? allocation.expiry_date.substring(0, 10)

        : '',

    status: allocation?.status || 'active'

  })



  const [saving, setSaving] = useState(false)



  function updateField(field, value) {

    setForm((previous) => ({

      ...previous,

      [field]: value

    }))

  }



  async function handleSubmit(e) {

    e.preventDefault()



    if (!form.user_id) {

      alert('Please select a user.')

      return

    }



    const allocated = Number(form.allocated_litres)

    const used = Number(form.used_litres || 0)



    if (!Number.isFinite(allocated) || allocated <= 0) {

      alert('Allocated litres must be greater than zero.')

      return

    }



    if (!Number.isFinite(used) || used < 0) {

      alert('Used litres cannot be negative.')

      return

    }



    if (used > allocated) {

      alert('Used litres cannot exceed allocated litres.')

      return

    }



    const remaining = allocated - used



    let status = form.status



    if (remaining <= 0) {

      status = 'exhausted'

    }



    setSaving(true)



    try {



      const payload = {

        user_id: form.user_id,

        allocated_litres: allocated,

        used_litres: used,

        remaining_litres: remaining,

        expiry_date: form.expiry_date

          ? `${form.expiry_date}T23:59:59`

          : null,

        status

      }



      let result



      if (allocation) {



        result = await supabase

          .from('allocations')

          .update(payload)

          .eq('id', allocation.id)



      } else {



        result = await supabase

          .from('allocations')

          .insert([payload])



      }



      if (result.error) {

        throw result.error

      }



      await onSaved()

      onClose()



    } catch (err) {



      console.error(err)

      alert(

        err.message ||

        'Failed to save allocation.'

      )



    } finally {

      setSaving(false)

    }

  }



  return (

    <div className="modal-overlay">



      <div className="modal">



        <div className="modal-header">



          <div>

            <h2>

              {allocation

                ? 'Edit Allocation'

                : 'Add Allocation'}

            </h2>



            <p>

              {allocation

                ? 'Update water allocation'

                : 'Allocate water to a user'}

            </p>

          </div>



          <button

            className="close-btn"

            onClick={onClose}

          >

            <X size={20} />

          </button>



        </div>



        <form onSubmit={handleSubmit}>



          <div className="form-group">



            <label>User</label>



            <select

              value={form.user_id}

              onChange={(e) =>

                updateField(

                  'user_id',

                  e.target.value

                )

              }

              disabled={Boolean(allocation)}

            >



              <option value="">

                Select a user

              </option>



              {users.map((user) => (

                <option

                  key={user.id}

                  value={user.id}

                >

                  {user.full_name}

                  {user.phone_number

                    ? ` - ${user.phone_number}`

                    : ''}

                </option>

              ))}



            </select>



            {allocation && (

              <small>

                User cannot be changed when editing an

                existing allocation.

              </small>

            )}



          </div>



          <div className="form-group">



            <label>Allocated Litres</label>



            <input

              type="number"

              min="0.01"

              step="0.01"

              value={form.allocated_litres}

              onChange={(e) =>

                updateField(

                  'allocated_litres',

                  e.target.value

                )

              }

              placeholder="Example: 100"

            />



          </div>



          <div className="form-group">



            <label>Used Litres</label>



            <input

              type="number"

              min="0"

              step="0.01"

              value={form.used_litres}

              onChange={(e) =>

                updateField(

                  'used_litres',

                  e.target.value

                )

              }

              placeholder="Example: 0"

            />



          </div>



          <div className="form-group">



            <label>Expiry Date</label>



            <input

              type="date"

              value={form.expiry_date}

              onChange={(e) =>

                updateField(

                  'expiry_date',

                  e.target.value

                )

              }

            />



          </div>



          <div className="form-group">



            <label>Status</label>



            <select

              value={form.status}

              onChange={(e) =>

                updateField(

                  'status',

                  e.target.value

                )

              }

            >

              <option value="active">Active</option>

              <option value="expired">Expired</option>

              <option value="exhausted">Exhausted</option>

            </select>



          </div>



          <div className="allocation-preview">



            <strong>

              Remaining water

            </strong>



            <span>

              {Math.max(

                0,

                Number(form.allocated_litres || 0) -

                Number(form.used_litres || 0)

              ).toFixed(2)} L

            </span>



          </div>



          <div className="modal-actions">



            <button

              type="button"

              className="secondary-btn"

              onClick={onClose}

            >

              Cancel

            </button>



            <button

              type="submit"

              className="primary-btn"

              disabled={saving}

            >

              {saving

                ? 'Saving...'

                : allocation

                  ? 'Update Allocation'

                  : 'Create Allocation'}

            </button>



          </div>



        </form>



      </div>



    </div>

  )

}





/* =========================================================

   TRANSACTIONS PAGE

========================================================= */



function TransactionsPage({
  transactions,
  waterPrice,
  loading,
  onRefresh
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [authFilter, setAuthFilter] = useState('all')

  const filteredTransactions = useMemo(() => {
    const term = search.toLowerCase().trim()

    return transactions.filter((transaction) => {
      const userName = transaction.users?.full_name || ''
      const authentication = transaction.authentication_method || ''
      const status = transaction.status || ''

      const matchesSearch =
        !term ||
        userName.toLowerCase().includes(term) ||
        authentication.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term) ||
        String(transaction.volume_litres || '').includes(term)

      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const matchesAuthentication =
        authFilter === 'all' || authentication === authFilter

      return matchesSearch && matchesStatus && matchesAuthentication
    })
  }, [transactions, search, statusFilter, authFilter])

  const successfulTransactions = filteredTransactions.filter(
    (transaction) => transaction.status === 'successful'
  )

  const failedTransactions = filteredTransactions.filter(
    (transaction) => transaction.status === 'failed'
  )

  const totalVolume = successfulTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.volume_litres || 0),
    0
  )

  const totalRevenue = successfulTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction, waterPrice),
    0
  )

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Water dispensing transaction history"
        onRefresh={onRefresh}
        loading={loading}
      />

      <div className="stats-grid">
        <StatCard icon={<Activity size={22} />} title="Transactions" value={filteredTransactions.length} />
        <StatCard icon={<Droplets size={22} />} title="Water Dispensed" value={`${totalVolume.toFixed(2)} L`} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard icon={<Activity size={22} />} title="Successful" value={successfulTransactions.length} />
        <StatCard icon={<Activity size={22} />} title="Failed" value={failedTransactions.length} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Price / Litre" value={`$${waterPrice.toFixed(2)}`} />
      </div>

      <div className="page-actions">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="transaction-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value)}>
            <option value="all">All Authentication</option>
            <option value="fingerprint">Fingerprint</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </div>
      </div>

      <section className="card">
        {loading ? (
          <LoadingState />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState text="No transactions match your search." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Volume</th>
                  <th>Price/L</th>
                  <th>Total</th>
                  <th>Authentication</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="user-name">
                        <div className="avatar">
                          {transaction.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <strong>{transaction.users?.full_name || 'Unknown User'}</strong>
                      </div>
                    </td>

                    <td>
                      <strong>{Number(transaction.volume_litres || 0).toFixed(2)} L</strong>
                    </td>

                    <td>
                      ${Number(transaction.price_per_litre ?? waterPrice).toFixed(2)}
                    </td>

                    <td>
                      <strong>${getTransactionAmount(transaction, waterPrice).toFixed(2)}</strong>
                    </td>

                    <td>
                      <span className="auth-badge">
                        {transaction.authentication_method || 'fingerprint'}
                      </span>
                    </td>

                    <td>
                      {transaction.device_id ? (
                        <span className="device-id" title={transaction.device_id}>
                          {transaction.device_id.substring(0, 8)}...
                        </span>
                      ) : (
                        'Unknown'
                      )}
                    </td>

                    <td>
                      <span className={`status ${transaction.status || 'failed'}`}>
                        {transaction.status || 'failed'}
                      </span>
                    </td>

                    <td>{formatDateTime(transaction.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


/* =========================================================

   DEVICES PAGE

========================================================= */



function DevicesPage({

  devices,

  loading,

  onRefresh

}) {

  return (

    <div>



      <PageHeader

        title="Devices"

        subtitle="Manage connected water stations"

        onRefresh={onRefresh}

        loading={loading}

      />



      <section className="card">



        {loading ? (

          <LoadingState />

        ) : devices.length === 0 ? (

          <EmptyState text="No devices registered." />

        ) : (



          <div className="table-wrapper">



            <table>



              <thead>

                <tr>

                  <th>Device</th>

                  <th>Location</th>

                  <th>Type</th>

                  <th>Status</th>

                  <th>Last Seen</th>

                </tr>

              </thead>



              <tbody>



                {devices.map((device) => (



                  <tr key={device.id}>



                    <td>

                      <strong>

                        {device.device_name}

                      </strong>

                    </td>



                    <td>

                      {device.location || '-'}

                    </td>



                    <td>

                      {device.device_type || '-'}

                    </td>



                    <td>

                      <span

                        className={`status ${

                          device.status || 'offline'

                        }`}

                      >

                        {device.status || 'offline'}

                      </span>

                    </td>



                    <td>

                      {device.last_seen

                        ? formatDate(device.last_seen)

                        : 'Never'}

                    </td>



                  </tr>



                ))}



              </tbody>



            </table>



          </div>



        )}



      </section>



    </div>

  )

}





/* =========================================================

   ANALYTICS PAGE

========================================================= */



function AnalyticsPage({
  allocations,
  transactions,
  users,
  waterPrice
}) {
  const totalAllocated = allocations.reduce(
    (sum, item) => sum + Number(item.allocated_litres || 0),
    0
  )

  const totalUsed = allocations.reduce(
    (sum, item) => sum + Number(item.used_litres || 0),
    0
  )

  const totalRemaining = allocations.reduce(
    (sum, item) => sum + Number(item.remaining_litres || 0),
    0
  )

  const successfulTransactions = transactions.filter(
    (transaction) => transaction.status === 'successful'
  )

  const failedTransactions = transactions.filter(
    (transaction) => transaction.status === 'failed'
  )

  const totalDispensed = successfulTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.volume_litres || 0),
    0
  )

  const totalRevenue = successfulTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction, waterPrice),
    0
  )

  const averagePerUser = users.length > 0 ? totalUsed / users.length : 0

  const averageTransaction =
    successfulTransactions.length > 0
      ? totalRevenue / successfulTransactions.length
      : 0

  const revenueByUser = users
    .map((user) => {
      const userTransactions = successfulTransactions.filter(
        (transaction) => transaction.user_id === user.id
      )

      const revenue = userTransactions.reduce(
        (sum, transaction) =>
          sum + getTransactionAmount(transaction, waterPrice),
        0
      )

      return {
        name: user.full_name || 'Unknown',
        revenue
      }
    })
    .filter((item) => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Water usage, transactions and revenue"
      />

      <div className="stats-grid">
        <StatCard icon={<Users size={22} />} title="Total Users" value={users.length} />
        <StatCard icon={<Droplets size={22} />} title="Total Allocated" value={`${totalAllocated.toFixed(2)} L`} />
        <StatCard icon={<Droplets size={22} />} title="Total Dispensed" value={`${totalDispensed.toFixed(2)} L`} />
        <StatCard icon={<Droplets size={22} />} title="Water Remaining" value={`${totalRemaining.toFixed(2)} L`} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard icon={<CircleDollarSign size={22} />} title="Average Transaction" value={`$${averageTransaction.toFixed(2)}`} />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Revenue by User</h2>
              <p>Calculated at ${waterPrice.toFixed(2)} per litre</p>
            </div>
          </div>

          {revenueByUser.length === 0 ? (
            <EmptyState text="No successful sales yet." />
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByUser}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>System Overview</h2>
              <p>Current water management statistics</p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-box"><span>Price per litre</span><strong>${waterPrice.toFixed(2)}</strong></div>
            <div className="analytics-box"><span>Allocations</span><strong>{allocations.length}</strong></div>
            <div className="analytics-box"><span>Transactions</span><strong>{transactions.length}</strong></div>
            <div className="analytics-box"><span>Successful</span><strong>{successfulTransactions.length}</strong></div>
            <div className="analytics-box"><span>Failed</span><strong>{failedTransactions.length}</strong></div>
            <div className="analytics-box"><span>Average used / user</span><strong>{averagePerUser.toFixed(2)} L</strong></div>
            <div className="analytics-box"><span>Total used from allocations</span><strong>{totalUsed.toFixed(2)} L</strong></div>
            <div className="analytics-box"><span>Total revenue</span><strong>${totalRevenue.toFixed(2)}</strong></div>
          </div>
        </section>
      </div>
    </div>
  )
}


/* =========================================================

   REUSABLE COMPONENTS

========================================================= */



function PageHeader({

  title,

  subtitle,

  onRefresh,

  loading

}) {

  return (

    <div className="page-header">



      <div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

      </div>



      {onRefresh && (

        <button

          className="secondary-btn refresh-btn"

          onClick={onRefresh}

          disabled={loading}

        >

          <RefreshCw size={17} />

          {loading ? 'Loading...' : 'Refresh'}

        </button>

      )}



    </div>

  )

}





function StatCard({

  icon,

  title,

  value

}) {

  return (

    <div className="stat-card">



      <div className="stat-icon">

        {icon}

      </div>



      <div>



        <p>{title}</p>



        <h2>{value}</h2>



      </div>



    </div>

  )

}





function TransactionTable({
  transactions,
  waterPrice
}) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Volume</th>
            <th>Price/L</th>
            <th>Total</th>
            <th>Authentication</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <strong>{transaction.users?.full_name || 'Unknown User'}</strong>
              </td>
              <td>{Number(transaction.volume_litres || 0).toFixed(2)} L</td>
              <td>${Number(transaction.price_per_litre ?? waterPrice).toFixed(2)}</td>
              <td>
                <strong>${getTransactionAmount(transaction, waterPrice).toFixed(2)}</strong>
              </td>
              <td>{transaction.authentication_method || 'fingerprint'}</td>
              <td>
                <span className={`status ${transaction.status || 'failed'}`}>
                  {transaction.status || 'failed'}
                </span>
              </td>
              <td>{formatDate(transaction.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function EmptyState({

  text

}) {

  return (

    <div className="empty-state">

      <Droplets size={30} />

      <p>{text}</p>

    </div>

  )

}





function LoadingState() {

  return (

    <div className="empty-state">

      <RefreshCw

        size={28}

        className="spin"

      />

      <p>Loading...</p>

    </div>

  )

}





/* =========================================================

   HELPERS

========================================================= */



function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getTransactionAmount(transaction, fallbackPrice = 0.10) {
  const volume = Number(transaction?.volume_litres || 0)

  if (transaction?.total_price != null) {
    const storedTotal = Number(transaction.total_price)

    if (Number.isFinite(storedTotal) && storedTotal > 0) {
      return storedTotal
    }
  }

  const transactionPrice = Number(
    transaction?.price_per_litre ?? fallbackPrice
  )

  const price =
    Number.isFinite(transactionPrice) && transactionPrice >= 0
      ? transactionPrice
      : fallbackPrice

  return volume * price
}

export default App