import React from 'react';
import Layout from '@/components/Layout';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </Layout>
  );
};

export default NotFound;

