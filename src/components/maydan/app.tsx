'use client';
import { Suspense } from 'react';
import { MaydanProvider } from './context';
import { Shell } from './shell';
import { Dashboard } from './dashboard';
import { LeaguesPage, LeagueDetail, LeagueRegistration, MatchesPage, MatchDetail } from './competition';
import { TeamPage, NewTeamPage, LineupPage, DiscoverPage, ProfilePage, RankingsPage } from './community';
import { PaymentsPage, SettingsPage, HelpPage } from './personal';
import { AdminOverview, AdminLeagues, LeagueEditor, AdminSchedule, AdminResults, AdminPeople, AdminFinance, AdminSettings } from './operations';
import { VenuesPage, OwnerPage } from './venues';
import { Empty } from './ui';
function Screen({screen}:{screen:string[]}){const [section,id,sub]=screen;switch(section){case undefined:return <Dashboard/>;case 'leagues':return id?(sub==='register'?<LeagueRegistration id={id}/>:<LeagueDetail id={id}/>):<LeaguesPage/>;case 'matches':return id?<MatchDetail id={id}/>:<MatchesPage/>;case 'team':return id==='new'?<NewTeamPage/>:id==='lineup'?<LineupPage/>:<TeamPage/>;case 'teams':return <TeamPage id={id}/>;case 'discover':return <DiscoverPage/>;case 'rankings':return <RankingsPage/>;case 'profile':return <ProfilePage/>;case 'players':return <ProfilePage id={id}/>;case 'payments':return <PaymentsPage/>;case 'settings':return <SettingsPage/>;case 'about':return <HelpPage about/>;case 'help':return <HelpPage/>;case 'venues':return <VenuesPage id={id}/>;case 'owner':return <OwnerPage section={id}/>;case 'admin':switch(id){case undefined:return <AdminOverview/>;case 'leagues':return sub?<LeagueEditor id={sub==='new'?undefined:sub}/>:<AdminLeagues/>;case 'schedule':return <AdminSchedule/>;case 'results':return <AdminResults/>;case 'people':return <AdminPeople/>;case 'finance':return <AdminFinance/>;case 'settings':return <AdminSettings/>;}default:return <Empty title="This page is off the pitch." description="Let’s get you back to your game." href="/" action="Back to the clubhouse"/>;}}
export function MaydanApp({screen=[]}:{screen?:string[]}){return <MaydanProvider><Shell><Suspense fallback={<div className="md-loading" role="status"><span/>Getting the pitch ready…</div>}><Screen screen={screen}/></Suspense></Shell></MaydanProvider>;}

