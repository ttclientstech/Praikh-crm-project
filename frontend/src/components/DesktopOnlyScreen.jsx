import React from 'react';
import { Result } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import './DesktopOnlyScreen.css';

export default function DesktopOnlyScreen() {
    return (
        <div className="desktop-only-screen">
            <div className="desktop-only-content">
                <div className="logo-container">
                    <img src="/images/icon.png" alt="Parikh Renewables" className="company-logo" />
                    <h1 className="company-name">Parikh Renewables</h1>
                    <p className="company-tagline">Solar EPC Specialists</p>
                </div>

                <div className="message-container">
                    <DesktopOutlined className="desktop-icon" />
                    <h2 className="message-title">Desktop Access Required</h2>
                    <p className="message-text">
                        For the best experience and full functionality, please access the Parikh Renewables CRM on a desktop or laptop computer.
                    </p>
                    <p className="message-subtext">
                        This application is optimized for desktop use and requires a larger screen to function properly.
                    </p>
                </div>

                <div className="contact-info">
                    <p>Need assistance? Contact us at:</p>
                    <a href="mailto:admin@parikhrenewables.com" className="contact-link">
                        admin@parikhrenewables.com
                    </a>
                </div>
            </div>
        </div>
    );
}
