-- P0-1 / NFR-005 / task-041：独立测试库，与开发库 lumen 物理隔离。
--
-- 仅在 PG 首次初始化（新 volume，POSTGRES_DB=lumen 创建时）由
-- /docker-entrypoint-initdb.d/ 自动执行；现有 lumen_pgdata volume 已初始化，
-- 挂载本脚本不会重跑——需一次性手动建库：
--   docker exec lumen-pg createdb -U lumen lumen_test
-- （状态变更，执行前需人工确认。）
CREATE DATABASE lumen_test;
