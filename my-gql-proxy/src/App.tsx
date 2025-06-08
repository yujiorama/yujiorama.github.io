import './App.css'

import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';


const fetcher = createGraphiQLFetcher({
    url: 'http://localhost:4000/graphql',
});


const App = () => <GraphiQL fetcher={fetcher} />;

export default App
