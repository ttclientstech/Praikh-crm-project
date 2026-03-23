import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import SolarProjectDashboard from './components/SolarProjectDashboard';

export default function ReadSolarProjectModule({ config }) {
    const dispatch = useDispatch();
    const { id } = useParams();

    useLayoutEffect(() => {
        dispatch(erp.read({ entity: config.entity, id }));
    }, [id]);

    const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

    if (isLoading) {
        return (
            <ErpLayout>
                <PageLoader />
            </ErpLayout>
        );
    } else
        return (
            <ErpLayout>
                {isSuccess ? (
                    <SolarProjectDashboard config={config} selectedItem={currentResult} />
                ) : (
                    <NotFound entity={config.entity} />
                )}
            </ErpLayout>
        );
}
