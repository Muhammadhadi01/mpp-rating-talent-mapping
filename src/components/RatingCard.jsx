export default function RatingCard({

    title,

    subtitle,

    description,

    icon

}) {



    return (

        <div className="card shadow h-100 border-0">


            <div className="card-body text-center">


                <div

                style={{

                    fontSize:"55px",

                    marginBottom:"15px"

                }}

                >

                    {icon}


                </div>




                <h4 className="fw-bold">

                    {title}


                </h4>




                <h6 className="text-primary">

                    {subtitle}


                </h6>




                <hr />




                <p className="text-muted">

                    {description}


                </p>




            </div>


        </div>


    );


}