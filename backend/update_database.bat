@echo off
echo Updating delegation_events table to add images column...
mysql -u root -p delegation_db < add_images_column.sql
echo Database updated successfully!
pause
