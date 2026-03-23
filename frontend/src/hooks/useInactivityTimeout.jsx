import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/auth/actions';
import { selectAuth } from '@/redux/auth/selectors';

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const useInactivityTimeout = (timeout = DEFAULT_TIMEOUT) => {
    const dispatch = useDispatch();
    const { isLoggedIn } = useSelector(selectAuth);
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (!isLoggedIn) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            dispatch(logout());
        }, timeout);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        if (isLoggedIn) {
            resetTimer();
            events.forEach((event) => {
                window.addEventListener(event, handleActivity);
            });
        }

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [timeout, dispatch, isLoggedIn]);

    return null;
};

export default useInactivityTimeout;
