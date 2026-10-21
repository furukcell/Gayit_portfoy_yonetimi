import React from 'react';
import { View } from 'react-native';
import HomeDashboardScreen from './HomeDashboardScreen';
import PortfolioScreen from './PortfolioScreen';
import { CustomersScreen } from './CustomersScreen';
import MatchesScreen from './MatchesScreen';
import MoreScreen from './MoreScreen';
import TeamScreen from './TeamScreen';
import StatsScreen from './StatsScreen';
import AgendaScreen from './AgendaScreen';

export default function WorkspaceScreens(props: any) {
  const { tab, styles, palette, role, setTab, customers, openCustomerDetail, properties, roleProperties, teamMembers, money, openProperty,
    portfolioPresentationMode, setPortfolioPresentationMode, setSelectedPresentationIds, selectedPresentationIds, setAddOpen,
    search, setSearch, quickTypeFilter, quickCityFilter, quickDistrictFilter, setQuickDropdown, quickDropdown, setQuickTypeFilter,
    setQuickCityFilter, setQuickDistrictFilter, filter, setFilter, sortBy, setSortBy, recentOnly, setRecentOnly, favoritesOnly,
    setFavoritesOnly, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter, statusFilter, setStatusFilter,
    showArchived, setShowArchived, createMultiPropertyPdf, propertiesLoading, visibleProperties, toggleFavorite, favoriteIds,
    customersLoading, customerSearch, setCustomerSearch, setCustomerModalOpen, matches, matchesLoading, setLegalDocument,
    superadminOfficeMode, setSuperadminOfficeMode, setRole, setOfficeId, setNotificationsOpen, notifications, loadNotifications,
    officeId, loadRecentViews, setCsvImportOpen, openProfile, setOfficeBrandingOpen, exportPortfolioCsv, setTransactionPropertyId, setTransactionModalOpen,
    handleSignOut, teamStatusBusyId, setAgentModalOpen, toggleAgentStatus, sharePortfolioReport, officeId } = props;
  return (
    <View style={styles.body}>
            {tab === 'home' && <HomeDashboardScreen styles={styles} palette={palette} role={role} setTab={setTab} customers={customers} openCustomerDetail={openCustomerDetail} properties={properties} roleProperties={roleProperties} teamMembers={teamMembers} money={money} openProperty={openProperty} />}
    
            <PortfolioScreen visible={tab === 'portfolio'} styles={styles} palette={palette} role={role} portfolioPresentationMode={portfolioPresentationMode} setPortfolioPresentationMode={setPortfolioPresentationMode} setSelectedPresentationIds={setSelectedPresentationIds} selectedPresentationIds={selectedPresentationIds} setAddOpen={setAddOpen} search={search} setSearch={setSearch} quickTypeFilter={quickTypeFilter} quickCityFilter={quickCityFilter} quickDistrictFilter={quickDistrictFilter} setQuickDropdown={setQuickDropdown} quickDropdown={quickDropdown} properties={properties} setQuickTypeFilter={setQuickTypeFilter} setQuickCityFilter={setQuickCityFilter} setQuickDistrictFilter={setQuickDistrictFilter} filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} recentOnly={recentOnly} setRecentOnly={setRecentOnly} favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly} minPriceFilter={minPriceFilter} setMinPriceFilter={setMinPriceFilter} maxPriceFilter={maxPriceFilter} setMaxPriceFilter={setMaxPriceFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} showArchived={showArchived} setShowArchived={setShowArchived} createMultiPropertyPdf={createMultiPropertyPdf} propertiesLoading={propertiesLoading} visibleProperties={visibleProperties} money={money} openProperty={openProperty} toggleFavorite={toggleFavorite} favoriteIds={favoriteIds} />
    
            <CustomersScreen
              visible={tab === 'customers'}
              role={role}
              customers={customers}
              customersLoading={customersLoading}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              openCustomerDetail={openCustomerDetail}
              openAddCustomer={() => setCustomerModalOpen(true)}
            />
    
            {tab === 'agenda' && <AgendaScreen styles={styles} palette={palette} officeId={officeId} customers={customers} openCustomerDetail={openCustomerDetail} />}
            {tab === 'matches' && <MatchesScreen styles={styles} palette={palette} matches={matches} matchesLoading={matchesLoading} money={money} />}
    
            {tab === 'more' && <MoreScreen styles={styles} palette={palette} setLegalDocument={setLegalDocument} superadminOfficeMode={superadminOfficeMode} setSuperadminOfficeMode={setSuperadminOfficeMode} setRole={setRole} setTab={setTab} setOfficeId={setOfficeId} role={role} setNotificationsOpen={setNotificationsOpen} notifications={notifications} loadNotifications={loadNotifications} officeId={officeId} setRecentOnly={setRecentOnly} setFavoritesOnly={setFavoritesOnly} loadRecentViews={loadRecentViews} setCsvImportOpen={setCsvImportOpen} openProfile={openProfile} setOfficeBrandingOpen={setOfficeBrandingOpen} exportPortfolioCsv={exportPortfolioCsv} setTransactionPropertyId={setTransactionPropertyId} properties={properties} setTransactionModalOpen={setTransactionModalOpen} handleSignOut={handleSignOut} />}
    
            <TeamScreen visible={tab === 'team'} teamMembers={teamMembers} teamStatusBusyId={teamStatusBusyId} onAddAgent={() => setAgentModalOpen(true)} onToggleAgentStatus={toggleAgentStatus} />
    
            <StatsScreen visible={tab === 'stats'} role={role} roleProperties={roleProperties} customers={customers} teamMembers={teamMembers} money={money} onSharePortfolioReport={sharePortfolioReport} />
          </View>
  );
}
