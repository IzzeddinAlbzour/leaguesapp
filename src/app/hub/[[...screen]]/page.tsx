import { MaydanApp } from '@/components/maydan/app';
export default async function HubPage({params}:{params:Promise<{screen?:string[]}>}){const {screen}=await params;return <MaydanApp screen={screen}/>;}
