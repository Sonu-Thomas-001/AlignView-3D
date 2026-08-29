'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-left' | 'slide-right';
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = domRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(currentRef);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [threshold, once]);

  const getAnimationStyles = () => {
    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return {
            opacity: 0,
            transform: 'translateY(36px)',
            transition: baseTransition,
          };
        case 'scale-up':
          return {
            opacity: 0,
            transform: 'scale(0.94) translateY(20px)',
            transition: baseTransition,
          };
        case 'slide-left':
          return {
            opacity: 0,
            transform: 'translateX(40px)',
            transition: baseTransition,
          };
        case 'slide-right':
          return {
            opacity: 0,
            transform: 'translateX(-40px)',
            transition: baseTransition,
          };
        case 'fade-in':
        default:
          return {
            opacity: 0,
            transform: 'translateY(0)',
            transition: baseTransition,
          };
      }
    }

    return {
      opacity: 1,
      transform: 'translate(0, 0) scale(1)',
      transition: baseTransition,
    };
  };

  return (
    <div ref={domRef} style={getAnimationStyles()} className={className}>
      {children}
    </div>
  );
};
