import PocketBase from 'pocketbase';

const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.sailybaev.kz';
const pb = new PocketBase(url);

export default pb;
