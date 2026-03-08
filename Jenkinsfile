pipeline {
    agent any

    environment {
        // Esta ID debe coincidir con la que creaste en el paso anterior
        ENV_FILE = credentials('findsmart-backend-env')
    }

    stages {
        stage('Checkout') {
            steps {
                // Detecta automáticamente la rama y configuración del Job
                checkout scm
            }
        }

        stage('Preparar Configuración') {
            steps {
                // Inyectamos el .env secreto
                sh 'cp $ENV_FILE .env'
            }
        }

        stage('Desplegar API') {
            steps {
                script {
                    // Verificamos si usar docker compose o docker-compose
                    def dockerCmd = sh(script: "docker compose version", returnStatus: true) == 0 ? "docker compose" : "docker-compose"
                    sh "${dockerCmd} up -d --build"
                }
            }
        }
    }

    post {
        always {
            // Aseguramos que la limpieza ocurra dentro del espacio de trabajo
            node('built-in' || 'master') {
                sh 'rm -f .env'
            }
        }
        success {
            echo '¡Backend de FindSmart (Domify) desplegado correctamente!'
        }
    }
}