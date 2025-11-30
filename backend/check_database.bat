@echo off
echo Checking delegation_events table...
mysql -u root -p delegation_db < check_images.sql
pause
