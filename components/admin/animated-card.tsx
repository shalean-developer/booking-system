'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  hover?: boolean;
}

export function AnimatedCard({ children, delay = 0, hover = true, ...props }: AnimatedCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Variant for stagger animations (for lists)
export function AnimatedCardList({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// Pre-wrapped Card component with animation
export function AnimatedCardWrapper({ title, children, delay = 0 }: { 
  title?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <AnimatedCard delay={delay}>
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    </AnimatedCard>
  );
}

