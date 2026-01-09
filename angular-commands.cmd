@echo off
REM ============================================
REM GHIPAS Angular CLI Commands (CMD)
REM Use these since PowerShell scripts are disabled
REM ============================================

echo GHIPAS Angular Development Commands
echo.

REM Set project directory
set PROJECT_DIR=e:\frontend

REM Navigate to project
cd /d %PROJECT_DIR%

REM ============================================
REM COMMON COMMANDS
REM ============================================

REM Start development server
REM node_modules\.bin\ng serve

REM Build for production
REM node_modules\.bin\ng build --configuration production

REM Run tests
REM node_modules\.bin\ng test

REM ============================================
REM GENERATE COMPONENTS
REM ============================================

REM Generate standalone component
REM node_modules\.bin\ng generate component common\components\notification --standalone

REM Generate regular component
REM node_modules\.bin\ng generate component features\inventory\inward-list

REM Generate component with routing
REM node_modules\.bin\ng generate component features\dashboard\admin-dashboard --routing

REM ============================================
REM GENERATE SERVICES
REM ============================================

REM Generate service
REM node_modules\.bin\ng generate service features\inventory\services\inventory

REM Generate service in root
REM node_modules\.bin\ng generate service core\services\auth

REM ============================================
REM GENERATE MODULES
REM ============================================

REM Generate module with routing
REM node_modules\.bin\ng generate module features\inventory --routing

REM Generate module without routing
REM node_modules\.bin\ng generate module shared

REM ============================================
REM ALTERNATIVE: Use npm run
REM ============================================

REM npm run ng -- generate component features\inventory\inward-list
REM npm run start
REM npm run build

echo.
echo Commands are commented out. Uncomment the one you need.
echo.
pause
