@echo off
echo Checking specific event images...
mysql -u root -p delegation_db < check_single_event.sql
pause
