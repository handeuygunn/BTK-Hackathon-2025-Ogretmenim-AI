-- Create daily_plans table for storing teacher daily plans
CREATE TABLE IF NOT EXISTS daily_plans (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    plan_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    UNIQUE(teacher_id, plan_date)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_plans_teacher_date ON daily_plans(teacher_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date);
